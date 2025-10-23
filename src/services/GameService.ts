// src/services/GameService.ts
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { getAnalytics, logEvent} from "firebase/analytics";


// Level definitions
const LEVELS = [
    {name: "Bronze", minPlays: 0, maxPlays: 50, reward: 100},
    {name: "Silver", minPlays: 50, maxPlays: 200, reward: 200},
    {name: "Gold", minPlays: 200, maxPlays: 500, reward: 400},
    {name: "Diamond", minPlays: 500, maxPlays: Infinity, reward: 800}
];

export const adnan = "adnan"

// Helper: get player level from play count

// @ts-ignore
function getPlayerLevel(playCount) {
    for (let i = 0; i < LEVELS.length; i++) {
        if (playCount >= LEVELS[i].minPlays && playCount < LEVELS[i].maxPlays) {
            return LEVELS[i];
        }
    }
    return LEVELS[0]; // default Bronze
}

// Helper: check if two dates are same UTC day

// @ts-ignore
function isSameUTCDate(date1, date2) {
    return date1.getUTCDate() === date2.getUTCDate() &&
        date1.getUTCMonth() === date2.getUTCMonth() &&
        date1.getUTCFullYear() === date2.getUTCFullYear();
}

// Firebase config — replace with your own
const firebaseConfig =
    {
        apiKey: "AIzaSyBV3rANre-Qz3JkwDfcJ5l81f-foi9wEFU",
        authDomain: "solitaire-game-536b5.firebaseapp.com",
        projectId: "solitaire-game-536b5",
        storageBucket: "solitaire-game-536b5.appspot.com",
        messagingSenderId: "843030836295",
        appId: "1:843030836295:web:eb8bf2c67658401733ad62"
    };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);


// @ts-ignore
export async function checkConnection(callback){

    try {
        // Try reading the ping doc
        const ref = doc(db, "system", "ping");
        await getDoc(ref);

        callback("OK");          // Online

        return true;
    } catch (err) {
        console.warn("Firebase offline:", err);
        callback("NOK");           // Offline
        return false;
    }

}


export async function getPlayerData() {


    logEvent(analytics, 'game_start', {
        level: 1
    });
    const playerId = getPlayerId();
    const collection = "players";

    const docRef = doc(db, collection, playerId);
    const docSnap = await getDoc(docRef);

    // Get country using the browser's `navigator` API
    const country = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";

    if (docSnap.exists()) {
        // ✅ Player found
        const data = docSnap.data();
        data.country = country; // add country
        return data;
    } else {
        // ❌ Player doesn't exist → create defaults
        const now = new Date();
        const defaultData = {
            coins: 300,
            level: "Bronze",
            cards: 3,
            hints: 3,
            playCount: 0,
            lastRewardTimestamp: Timestamp.fromDate(now),
            country, // save country
        };

        await setDoc(docRef, defaultData);
        return defaultData;
    }
}


/**
 * Save data to Firestore
 */
// @ts-ignore
export async function saveData(collection, docId, data) {
    try {
        await setDoc(doc(db, collection, docId), data, {merge: true});
        console.log("Data saved successfully!");
    } catch (error) {
        console.error("Error saving data:", error);
    }
}

/**
 * Read data from Firestore
 */
// @ts-ignore
export async function getData(collection, docId) {
    try {
        const docRef = doc(db, collection, docId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        console.error("Error reading data:", error);
        return null;
    }
}

/**
 * Generate or get player ID stored in localStorage
 */
export function getPlayerId() {
    let playerId = localStorage.getItem("playerId");
    if (!playerId) {
        playerId = 'player_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem("playerId", playerId);
    }
    return playerId;
}

/**
 * Claim daily reward for a player
 */




export async function claimDailyReward() {
    const playerId = getPlayerId();
    const collection = "players";
    // @ts-ignore
    const playerData = await getData(collection, playerId);

    // First-time player
    if (!playerData) {
        console.log("First-time player: initializing default data");
        const now = new Date();
        const country = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";

        await saveData(collection, playerId, {
            coins: 300,
            playCount: 0,
            level: "Bronze",
            dailyStreak: 0,
            lastRewardTimestamp: Timestamp.fromDate(now),
            country: country,
        });
        return { claimed: false, streak: 0, reward: 0, level: "Bronze" };
    }

    const now = new Date();
    let newStreak = 1;

    const lastTimestamp = playerData.lastRewardTimestamp?.toDate
        ? playerData.lastRewardTimestamp?.toDate()
        : new Date(playerData.lastRewardTimestamp);

    // Already claimed today
    if (isSameUTCDate(lastTimestamp, now)) {
        return {
            claimed: false,
            streak: playerData.dailyStreak,
            reward: 0,
            level: playerData.level
        };
    }

    // Streak continuation
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (isSameUTCDate(lastTimestamp, yesterday)) {
        newStreak = (playerData.dailyStreak || 0) + 1;
    }

    // Increment play count
    const newPlayCount = (playerData.playCount || 0) + 1;

    // Determine level and reward
    const playerLevel = getPlayerLevel(newPlayCount);
    const reward = playerLevel.reward;

    const country = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";
    // Save updates
    await saveData(collection, playerId, {
        coins: (playerData.coins || 0) + reward,
        playCount: newPlayCount,
        level: playerLevel.name,
        dailyStreak: newStreak,
        lastRewardTimestamp: Timestamp.fromDate(now),
        country: country,
    });

    return {
        claimed: true,
        streak: newStreak,
        reward,
        level: playerLevel.name,
        playCount: newPlayCount
    };
}



/**
 * Check if daily reward is already claimed today
 */
export async function isDailyRewardClaimed() {
    const playerId = getPlayerId();
    const collection = "players";
    const playerData = await getData(collection, playerId);

    if (!playerData || !playerData.lastRewardTimestamp) return false;

    const lastTimestamp = playerData.lastRewardTimestamp.toDate
        ? playerData.lastRewardTimestamp.toDate()
        : new Date(playerData.lastRewardTimestamp);

    return isSameUTCDate(lastTimestamp, new Date());
}

/**
 * Reset player to default values
 */
export async function resetPlayerDefaults() {
    const playerId = getPlayerId();
    const collection = "players";

    const defaultData =
        {
            dailyStreak: 0,
            lastRewardTimestamp: null,
            rewards: [],
            coins: 300,
            playCount: 0,
            level: "Bronze"
        };

    try {
        await saveData(collection, playerId, defaultData);
        console.log("Player reset to default values!");
    } catch (error) {
        console.error("Error resetting player:", error);
    }
}

/**
 * Get current player level
 * @returns {Promise<string>} - player level name ("Bronze", "Silver", etc.)
 */
export async function getPlayerLevelFromFirebase() {
    const playerId = getPlayerId();
    const collection = "players";
    const playerData = await getData(collection, playerId);

    if (!playerData) {
        // First-time player → default level
        return "Bronze";
    }

    const playCount = playerData.playCount || 0;
    const level = getPlayerLevel(playCount); // uses your existing LEVELS logic
    return level.name;
}

/**
 * Spend coins from the player account
 * @param {number} amount - number of coins to spend
 * @returns {Promise<{success: boolean, coins: number}>} - new coin balance
 */
// @ts-ignore
export async function spendCoins(amount) {
    const playerId = getPlayerId();
    const collection = "players";
    const playerData = await getData(collection, playerId);

    if (!playerData) {
        console.warn("Player not found! Cannot spend coins.");
        return {success: false, coins: 0, cards: 0};
    }

    const currentCoins = playerData.coins ?? 0;
    const currentCards = playerData.cards ?? 0;

    if (currentCoins < amount) {
        console.warn("Not enough coins to spend!");
        return {success: false, coins: currentCoins, cards: currentCards};
    }

    const newCoins = currentCoins - amount;
    const newCards = currentCards + 1;

    await saveData(collection, playerId,
        {
            coins: newCoins,
            cards: newCards
        });

    console.log(`Player spent $ {amount} coins. New balance: $ {newCoins}, cards: $ {newCards}`);

    return {success: true, coins: newCoins, cards: newCards};
}

// Spend one card from the player account
export async function spendCardAsync() {
    const playerId = getPlayerId();
    const collection = "players";
    const playerData = await getData(collection, playerId);

    if (!playerData) {
        console.warn("Player not found! Cannot spend card.");
        return {success: false, cards: 0};
    }

    const currentCards = playerData.cards ?? 0;

    if (currentCards <= 0) {
        console.warn("No cards available to spend!");
        return {success: false, cards: 0};
    }

    const newCards = currentCards - 1;

    await saveData(collection, playerId,
        {
            cards: newCards
        });

    console.log(`Player spent 1 card. Remaining cards: $ {newCards}`);

    return {success: true, cards: newCards};
}

/**
 * Add coins to the player account
 * @param {number} amount - number of coins to add
 * @returns {Promise<{success: boolean, coins: number}>} - new coin balance
 */

// @ts-ignore
export async function addCoins(amount) {
    const playerId = getPlayerId();
    const collection = "players";
    const playerData = await getData(collection, playerId);

    if (!playerData) {
        console.warn("Player not found! Cannot add coins.");
        return {success: false, coins: 0};
    }

    const currentCoins = playerData.coins || 0;
    const newCoins = currentCoins + amount;

    await saveData(collection, playerId, {coins: amount});
    console.log(`Added $ {amount} coins. New balance: $ {newCoins}`);

    return {success: true, coins: newCoins};
}

/**
 * Increment the player's play count by 1
 * @returns {Promise<{success: boolean, playCount: number}>}
 */
export async function incrementPlayCount() {
    const playerId = getPlayerId();
    const collection = "players";
    const playerData = await getData(collection, playerId);

    if (!playerData) {
        console.warn("Player not found! Cannot update play count.");
        // Initialize first-time player with playCount = 1
        await saveData(collection, playerId, {playCount: 1, coins: 300, cards: 0, level: "Bronze"});
        return {success: true, playCount: 1};
    }

    const newPlayCount = (playerData.playCount || 0) + 1;

    await saveData(collection, playerId,
        {
            playCount: newPlayCount
        });

    console.log(`Player finished a game. New play count: $ {newPlayCount}`);

    return {success: true, playCount: newPlayCount};
}

/**
 * Spend one hint from the player account
 * @returns {Promise<{success: boolean, hints: number}>}
 */
export async function spendHint() {
    const playerId = getPlayerId();
    const collection = "players";
    const playerData = await getData(collection, playerId);

    if (!playerData) {
        console.warn("Player not found! Cannot spend hint.");
        return {success: false, hints: 0};
    }

    const currentHints = playerData.hints ?? 0;

    if (currentHints <= 0) {
        console.warn("No hints available to spend!");
        return {success: false, hints: 0};
    }

    const newHints = currentHints - 1;

    await saveData(collection, playerId,
        {
            hints: newHints
        });

    console.log(`Player used 1 hint. Remaining hints: $ {newHints}`);

    return {success: true, hints: newHints};
};

/**
 * Add hints to the player account
 * @param {number} amount - number of hints to add
 * @returns {Promise<{success: boolean, hints: number}>}
 */
export async function buyHints(amount = 1) {
    const playerId = getPlayerId();
    const collection = "players";
    const playerData = await getData(collection, playerId);

    if (!playerData) {
        console.warn("Player not found! Cannot add hints.");
        // Initialize new player with hints
        await saveData(collection, playerId, {hints: amount, coins: 300, cards: 0, level: "Bronze"});
        return {success: true, hints: amount};
    }

    const currentHints = playerData.hints ?? 0;
    const newHints = currentHints + 1;
    const newCredit = playerData.coins - amount;

    await saveData(collection, playerId, {hints: newHints});

    console.log(`Player bought $ {amount} hint(s). Total hints: $ {newHints}`);

    return {success: true, hints: newHints, coins: newCredit};
};

