import * as SQLite from 'expo-sqlite';

// Database instance
let db: SQLite.SQLiteDatabase | null = null;

// Open and initialize the database
export const initDatabase = async (): Promise<void> => {
  try {
    if (db) {
      console.log('Database already initialized');
      return;
    }

    // Open database asynchronously
    db = await SQLite.openDatabaseAsync('expenses.db');

    // Enable foreign key support and WAL journal mode
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // Create tables within a transaction
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
  CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    destination TEXT NOT NULL,
    members TEXT,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    isCompleted INTEGER DEFAULT 0,
    photoUris TEXT
  );
`);

await db.execAsync(`
  CREATE TABLE IF NOT EXISTS trip_members (
    id TEXT PRIMARY KEY NOT NULL,
    trip_id TEXT NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
  );
`);

await db.execAsync(`
  CREATE TABLE IF NOT EXISTS expense_splits (
    id TEXT PRIMARY KEY NOT NULL,
    expense_id TEXT NOT NULL,
    owedBy TEXT NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY (expense_id) REFERENCES actual_expenses (id) ON DELETE CASCADE
  );
`);



    await db.execAsync(`
  CREATE TABLE IF NOT EXISTS member_expenses (
      id TEXT PRIMARY KEY,
      tripId TEXT,
      memberName TEXT,
      amountPaid REAL,
      FOREIGN KEY (tripId) REFERENCES trips(id)
  );
`);

await db.execAsync(`
  CREATE TABLE IF NOT EXISTS actual_expenses (
    id TEXT PRIMARY KEY NOT NULL,
    item_id TEXT NOT NULL,
    label TEXT NOT NULL,
    amount REAL NOT NULL,
    paidBy TEXT NOT NULL,
    FOREIGN KEY (item_id) REFERENCES expense_items(id) ON DELETE CASCADE
  );
`);


  

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS expense_categories (
          id TEXT PRIMARY KEY NOT NULL,
          trip_id TEXT NOT NULL,
          name TEXT NOT NULL,
          predictedTotal REAL DEFAULT 0,
          actualTotal REAL DEFAULT 0,
          FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
        );
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS expense_items (
          id TEXT PRIMARY KEY NOT NULL,
          category_id TEXT NOT NULL,
          name TEXT NOT NULL,
          predictedCost REAL NOT NULL,
          actualCost REAL DEFAULT 0,
          FOREIGN KEY (category_id) REFERENCES expense_categories (id) ON DELETE CASCADE
        );
      `);
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Execute SQL query
export const executeSql = async <T = any>(
  sql: string,
  params: any[] = []
): Promise<{ rows: { _array: T[] } }> => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }

  try {
    // For SELECT queries
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const results = await db.getAllAsync<T>(sql, params);
      return { rows: { _array: results } };
    }
    // For INSERT, UPDATE, DELETE queries
    else {
      await db.runAsync(sql, params);
      return { rows: { _array: [] } };
    }
  } catch (error) {
    console.error('SQL Error:', error);
    throw error;
  }
};

// Fetch the most recent upcoming trip
export const fetchMostRecentUpcomingTrip = async (): Promise<any> => {
  const query = `
    SELECT * FROM trips
    WHERE startDate >= date('now')
    ORDER BY startDate ASC
    LIMIT 1;
  `;
  try {
    const result = await executeSql(query);
    return result.rows._array[0] || null;
  } catch (error) {
    console.error('Error fetching most recent upcoming trip:', error);
    throw error;
  }
};

// Fetch the list of completed trips
export const fetchCompletedTrips = async (): Promise<any[]> => {
  const query = `
    SELECT * FROM trips
    WHERE isCompleted = 1
    ORDER BY endDate DESC;
  `;
  try {
    const result = await executeSql(query);
    return result.rows._array;
  } catch (error) {
    console.error('Error fetching completed trips:', error);
    throw error;
  }
};

// Close database connection (optional)
export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.closeAsync();
    db = null;
  }
};

export const deleteTripById = async (tripId: string): Promise<void> => {
  try {
    await executeSql(`DELETE FROM trips WHERE id = ?`, [tripId]);
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
};

export const addActualExpense = async (
  itemId: string,
  label: string,
  amount: number,
  paidBy: string
): Promise<void> => {
  const id = `${Date.now()}-${Math.random()}`; // quick unique ID
  await executeSql(
    `INSERT INTO actual_expenses (id, item_id, label, amount, paidBy) VALUES (?, ?, ?, ?, ?)`,
    [id, itemId, label, amount, paidBy]
  );
};

export const getActualExpensesForItem = async (itemId: string): Promise<any[]> => {
  const result = await executeSql(`SELECT * FROM actual_expenses WHERE item_id = ?`, [itemId]);
  return result.rows._array;
};

export const getTotalActualForItem = async (itemId: string): Promise<number> => {
  const result = await executeSql(
    `SELECT SUM(amount) as total FROM actual_expenses WHERE item_id = ?`,
    [itemId]
  );
  return result.rows._array[0]?.total || 0;
};
