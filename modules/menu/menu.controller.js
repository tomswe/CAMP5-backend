import * as menuService from './menu.service.js'
import * as menuValidation from './menu.validation.js'

export const createMenu = async (req, res) => {
    try {
        const data = menuValidation.createMenuSchema.parse(req.body)
        const menu = await menuService.createMenu(data)
        res.status(201).json(menu)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

export const updateMenu = async (req, res) => {
    try {
        const id = req.params.id
        const data = menuValidation.updateMenuSchema.parse(req.body)
        const menu = await menuService.updateMenu(id, data)

        res.json(menu)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

export const getAllmenu = async (req, res) => {
    try {
        const allMenu = await menuService.getAllmenu();
        res.status(200).json(allMenu);
    } catch (error) {
        console.error('Error getting all menus:', error);
        res.status(500).json({ message: error.message });
    }
}

export const getMenu = async (req, res) => {
    try {
        const id = req.params.id
        const menu = await menuService.getMenuById(id)

        res.json(menu)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

export const deleteMenu = async (req, res) => {
    try {
        const id = req.params.id
        const menu = await menuService.deleteMenu(id)

        res.json({ message: `Menu dengan id ${id} telah dihapus.` })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}