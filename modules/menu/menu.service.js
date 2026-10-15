import * as menuRepo from './menu.repository.js'

export const createMenu = async (data) => {
    return await menuRepo.createMenu(data)
}

export const updateMenu = async (id, data) => {
    const existing = await menuRepo.getMenuById(id)
    if (!existing) {
        throw new Error('Menu is not found')
    }

    return await menuRepo.updateMenu(id, data)
}

export const deleteMenu = async (id) => {
    const existing = await menuRepo.getMenuById(id)
    if (!existing) {
        throw new Error('Menu is not found')
    }

    await menuRepo.deleteMenu(id)
}

export const getAllmenu = async () => {
    const allMenu = await menuRepo.getAllMenu()

    return allMenu
}

export const getMenuById = async (id) => {
    const existing = await menuRepo.getMenuById(id)
    if (!existing) {
        throw new Error('Menu is not found')
    }
    const menu = await menuRepo.getMenuById(id)
    return menu
}