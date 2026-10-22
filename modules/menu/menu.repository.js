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

// dipakai untuk ambil brp banyak halaman
// Menghitung jumlah total halaman berdasarkan jumlah data menu dan limit per halaman.
export const getPages = async (limit) => {
    const { rows } = await db.query(
        `SELECT CEIL(COUNT(*)::decimal / $1) AS total_pages
     FROM menus
     WHERE is_deleted = false`,
        [limit], // Mengirim nilai limit sebagai parameter query SQL.
    );

    // CEIL() membulatkan hasil pembagian ke atas agar semua data tercakup.
    // Contoh: 12 data / 5 data per halaman = 2.4, dibulatkan menjadi 3 halaman.
    // rows[0] berisi objek dengan properti total_pages.
    return rows[0];
};

// Mengambil data menu berdasarkan halaman yang diminta.
export const getMenuWithPagination = async (page = 1, limit = 20) => {
    // Menghitung jumlah data yang harus dilewati sebelum mengambil data.
    // Rumus: (halaman - 1) * jumlah data per halaman.
    // Contoh: page = 3, limit = 5 -> offset = (3 - 1) * 5 = 10.
    const offset = (page - 1) * limit;
    const { rows } = await db.query(
        "SELECT * FROM menus WHERE is_deleted=false ORDER BY id LIMIT $1 OFFSET $2",
        [limit, // Membatasi jumlah data yang diambil dalam satu halaman.
            offset // Menentukan jumlah data yang dilewati.
        ],
    );
    // Mengembalikan array berisi data menu pada halaman yang diminta.
    return rows;
};