// server/matchQueue.js
const { RBTree } = require('bintrees');

class MatchQueue {
  constructor() {
    this.tree = new RBTree((a, b) => {
      if (a.rating !== b.rating) return a.rating - b.rating;
      return a.socketId.localeCompare(b.socketId);
    });
  }

  insert(user) {
    this.tree.insert(user);
  }

  remove(user) {
    this.tree.remove(user);
  }

  /**
   * Find + remove the user whose rating is closest to `user.rating`.
   * Returns matched user or null if empty.
   */
  match(user) {
    if (this.tree.size === 0) return null;

    // Get an iterator positioned at the first node >= user
    const it = this.tree.lowerBound(user);
    const candidates = [];
    const c1 = it.data();
    if (c1) {
      candidates.push({ user: c1, diff: Math.abs(c1.rating - user.rating) });
    }
    const c2 = it.prev();
    if (c2) {
      candidates.push({ user: c2, diff: Math.abs(c2.rating - user.rating) });
    }

    if (candidates.length === 0) return null;

    // Pick the one with the smallest diff
    candidates.sort((a, b) => a.diff - b.diff);
    const best = candidates[0].user;

    this.tree.remove(best);
    return best;
  }
}

module.exports = MatchQueue;
