import { db } from '../../config/db.config.js'

export const createMenu = async (data) => {
    const { name, description, price, is_available } = data
    const { rows } = await db.query(`INSERT INTO menus (name, description, price, is_available) VALUES ($1, $2, $3, $4) RETURNING *`, [name, description, price, is_available])
    return rows[0]
}

export const getAllMenu = async () => {
    const { rows } = await db.query(`SELECT * FROM menus WHERE is_deleted = false`)
    return rows
}

export const getMenuById = async (id) => {
    const { rows } = await db.query(`SELECT * FROM menus WHERE id = $1 AND is_deleted = false`, [id])
    return rows[0]
}

export const updateMenu = async (id, data) => {
    const { name, description, price, is_available } = data
    const { rows } = await db.query(`UPDATE menus SET name = $1, description = $2, price = $3, is_available = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND is_deleted = false RETURNING *`, [name, description, price, is_available, id])
    return rows[0]
}

export const deleteMenu = async (id) => {
    const { rows } = await db.query(`UPDATE menus SET is_deleted = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id])
    return rows[0]
}