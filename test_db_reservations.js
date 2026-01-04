const DatabaseService = require('./electron/database/db.js');
const path = require('path');
const fs = require('fs');

// Use a temporary database for testing
const dbPath = path.join(__dirname, 'test.db');
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
}

const db = new DatabaseService(dbPath);

async function test() {
    console.log('--- Starting Test ---');

    // 1. Create a user
    const userId = db.createUser('testuser', 'password', 'Test User', 'admin');
    console.log('Created user:', userId);

    // 2. Create a client
    const clientId = db.createClient('Test Client', '1234567890', 'test@example.com', 'Notes');
    console.log('Created client:', clientId);

    // 3. Create a PC
    const pcId = db.createPC('Test PC', 'Description');
    console.log('Created PC:', pcId);

    // 4. Create a reservation with VALID user
    const startTime = '2023-11-23T10:00:00';
    const endTime = '2023-11-23T11:00:00';
    const resId = db.createReservation(clientId, pcId, startTime, endTime, 'Valid User Reservation', userId);
    console.log('Created reservation with valid user:', resId);

    // 5. Create a reservation with INVALID user
    const invalidUserId = 999;
    const startTime2 = '2023-11-23T12:00:00';
    const endTime2 = '2023-11-23T13:00:00';
    const resId2 = db.createReservation(clientId, pcId, startTime2, endTime2, 'Invalid User Reservation', invalidUserId);
    console.log('Created reservation with invalid user:', resId2);

    // 6. Retrieve reservations
    const reservations = db.getAllReservations();
    console.log('All reservations count:', reservations.length);
    reservations.forEach(r => console.log(`- Reservation ${r.id}: ${r.notes} (Created by: ${r.created_by_name})`));

    if (reservations.find(r => r.id === resId2)) {
        console.log('SUCCESS: Reservation with invalid user is visible.');
    } else {
        console.log('FAILURE: Reservation with invalid user is NOT visible.');
    }

    db.close();
    fs.unlinkSync(dbPath);
}

test().catch(console.error);
