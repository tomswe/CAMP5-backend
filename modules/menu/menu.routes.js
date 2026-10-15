import { Router } from 'express';
import * as menuController from './menu.controller.js'
const router = Router();


router.get('/', menuController.getAllmenu)

router.get('/:id', menuController.getMenu)

router.post('/', menuController.createMenu);

router.put('/:id', menuController.updateMenu);

router.delete('/:id', menuController.deleteMenu);

export default router;