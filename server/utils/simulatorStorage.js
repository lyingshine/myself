const fs = require('fs')
const path = require('path')

const SESSION_FILE = path.join(__dirname, '..', 'data', 'sim_sessions.json')
const USERS_FILE = path.join(__dirname, '..', 'data', 'sim_users.json')

async function writeSessionSnapshot(data) {
  try {
    await fs.promises.writeFile(SESSION_FILE, JSON.stringify(data))
  } catch (_err) {
    // ignore write errors in simulator
  }
}

async function writeUsersSnapshot(users) {
  try {
    await fs.promises.writeFile(USERS_FILE, JSON.stringify(users))
  } catch (_err) {
    // ignore write errors in simulator
  }
}

function readSessionSnapshot() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'))
    }
  } catch (_err) {
    // ignore read errors
  }
  return { active: [], completed: [] }
}

function readUsersSnapshot() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
    }
  } catch (_err) {
    // ignore read errors
  }
  return []
}

module.exports = {
  writeSessionSnapshot,
  writeUsersSnapshot,
  readSessionSnapshot,
  readUsersSnapshot
}
