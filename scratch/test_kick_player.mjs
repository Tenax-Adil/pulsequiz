import {
  createRoom,
  joinRoom,
  kickPlayer,
  getRoom,
} from '../src/services/firebase.js';

import {
  createGeoRoom,
  joinGeoRoom,
  submitBuzz,
  kickGeoPlayer,
  getGeoRoom,
} from '../src/services/geoFirebase.js';

console.log('Testing Kick Player functionality for Classic Quiz and Geo Quiz...');

async function testClassicKick() {
  console.log('\n--- 1. Testing Classic Quiz Kick ---');
  const room = await createRoom({
    title: 'Test Classic Room',
    questions: [{ id: 'q1', text: 'Sample Q', options: ['A', 'B', 'C', 'D'], correctOptionIndex: 0 }],
  });
  const roomCode = room.roomCode;
  console.log('Created classic room:', roomCode);

  const player1 = { id: 'p_kick_1', nickname: 'Intruder1', avatar: '👾' };
  const player2 = { id: 'p_legit_2', nickname: 'GoodStudent', avatar: '🌟' };

  await joinRoom(roomCode, player1);
  await joinRoom(roomCode, player2);

  let snapshot = await getRoom(roomCode);
  console.log('Players joined:', Object.keys(snapshot.players || {}));
  if (!snapshot.players?.p_kick_1 || !snapshot.players?.p_legit_2) {
    throw new Error('Players did not join properly');
  }

  // Host kicks Intruder1
  console.log('Kicking Intruder1 (p_kick_1)...');
  await kickPlayer(roomCode, 'p_kick_1');

  snapshot = await getRoom(roomCode);
  console.log('Players after kick:', Object.keys(snapshot.players || {}));
  console.log('Kicked record:', snapshot.kicked);

  if (snapshot.players?.p_kick_1) {
    throw new Error('FAIL: Intruder1 is still in players list!');
  }
  if (!snapshot.players?.p_legit_2) {
    throw new Error('FAIL: GoodStudent was mistakenly removed!');
  }
  if (!snapshot.kicked?.p_kick_1) {
    throw new Error('FAIL: Kicked registry did not record p_kick_1!');
  }

  // Verify Intruder1 cannot re-join
  try {
    await joinRoom(roomCode, player1);
    throw new Error('FAIL: Kicked player was allowed to re-join!');
  } catch (err) {
    console.log('Re-join correctly rejected with error:', err.message);
  }
  console.log('Classic Quiz Kick PASSED! ✅');
}

async function testGeoKick() {
  console.log('\n--- 2. Testing Geo Quiz Kick ---');
  const geoRoom = await createGeoRoom({
    title: 'Test Geo Room',
    locations: [{ id: 'loc1', name: 'Paris', lat: 48.8566, lng: 2.3522 }],
  });
  const roomCode = geoRoom.roomCode;
  console.log('Created geo room:', roomCode);

  const geoPlayer1 = { id: 'geo_p_bad', nickname: 'TrollUser', avatar: '🌋' };
  const geoPlayer2 = { id: 'geo_p_good', nickname: 'Explorer', avatar: '🧭' };

  await joinGeoRoom(roomCode, geoPlayer1);
  await joinGeoRoom(roomCode, geoPlayer2);

  // Both buzz in
  await submitBuzz(roomCode, 'geo_p_bad');
  await submitBuzz(roomCode, 'geo_p_good');

  let snapshot = await getGeoRoom(roomCode);
  console.log('Geo players joined:', Object.keys(snapshot.players || {}));
  console.log('Buzzer queue before kick:', Object.keys(snapshot.buzzerQueue || {}));

  if (!snapshot.buzzerQueue?.geo_p_bad) {
    throw new Error('TrollUser did not buzz in properly');
  }

  // Host kicks TrollUser
  console.log('Kicking TrollUser from Geo room...');
  await kickGeoPlayer(roomCode, 'geo_p_bad');

  snapshot = await getGeoRoom(roomCode);
  console.log('Geo players after kick:', Object.keys(snapshot.players || {}));
  console.log('Buzzer queue after kick:', Object.keys(snapshot.buzzerQueue || {}));
  console.log('Geo kicked record:', snapshot.kicked);

  if (snapshot.players?.geo_p_bad) {
    throw new Error('FAIL: TrollUser is still in Geo players list!');
  }
  if (snapshot.buzzerQueue?.geo_p_bad) {
    throw new Error('FAIL: TrollUser is still in buzzer queue!');
  }
  if (!snapshot.players?.geo_p_good) {
    throw new Error('FAIL: Explorer was mistakenly removed!');
  }
  if (!snapshot.buzzerQueue?.geo_p_good) {
    throw new Error('FAIL: Explorer buzzer queue was cleared!');
  }
  if (!snapshot.kicked?.geo_p_bad) {
    throw new Error('FAIL: Kicked registry did not record geo_p_bad!');
  }

  // Verify TrollUser cannot re-join
  try {
    await joinGeoRoom(roomCode, geoPlayer1);
    throw new Error('FAIL: Kicked Geo player was allowed to re-join!');
  } catch (err) {
    console.log('Geo re-join correctly rejected with error:', err.message);
  }
  console.log('Geo Quiz Kick PASSED! ✅');
}

async function run() {
  try {
    await testClassicKick();
    await testGeoKick();
    console.log('\nALL KICK PLAYER TESTS PASSED! 🎉✅');
  } catch (err) {
    console.error('\nTEST FAILED ❌:', err);
    process.exit(1);
  }
}

run();
