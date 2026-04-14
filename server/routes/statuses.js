const express = require('express')
const router = express.Router()
const { getStatuses, createStatus, deleteStatus } = require('../data/statuses')
const { authMiddleware } = require('../middleware/auth')
const pool = require('../db/pool')

// GET /api/statuses - 获取动态列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, cursor, authorId } = req.query
    const parsedAuthorId = Number(authorId || 0)
    const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 100)

    if (parsedAuthorId > 0) {
      const params = [parsedAuthorId]
      let query = 'SELECT id, content, author_id, author_username, author_avatar, likes, created_at FROM statuses WHERE author_id = ?'
      if (cursor) {
        query += ' AND id < ?'
        params.push(parseInt(cursor, 10))
      }
      query += ' ORDER BY id DESC LIMIT ?'
      params.push(parsedLimit + 1)

      const [rows] = await pool.read(query, params)
      const hasMore = rows.length > parsedLimit
      const statuses = hasMore ? rows.slice(0, -1) : rows
      const nextCursor = statuses.length ? statuses[statuses.length - 1].id : null

      return res.json({ success: true, data: statuses, hasMore, nextCursor })
    }

    const result = await getStatuses(page, limit, cursor)
    res.json({ success: true, data: result.statuses, hasMore: result.hasMore, nextCursor: result.nextCursor })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '获取动态失败' })
  }
})

// POST /api/statuses - 发布动态
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: '内容不能为空' })
    }
    const newStatus = await createStatus({ content: content.trim(), authorId: req.user.id })
    res.status(201).json({ success: true, data: newStatus })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '发布动态失败' })
  }
})

// DELETE /api/statuses/:id - 删除动态
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const deleted = await deleteStatus(id, req.user.id)
    if (!deleted) {
      return res.status(404).json({ success: false, message: '动态未找到或无权限' })
    }
    res.json({ success: true, message: '动态已删除' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '删除动态失败' })
  }
})

module.exports = router