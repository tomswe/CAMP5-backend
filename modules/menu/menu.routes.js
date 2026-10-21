import { Router } from 'express';
import * as menuController from './menu.controller.js'
import { log } from '../../middleware/log.middleware.js';
import { auth } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/authorizeRole.middleware.js';

const router = Router();

// log tidak dipanggil metode next()
// request stuck tidak akan dilanjutkan ke middleware selanjutnya
router.get('/', log, menuController.getAllmenu)

router.get('/:id', menuController.getMenu)
// Batasi agar user biasa tidak bisa buat menu baru
// router.post('/', cekLogin, cekIsAdmin,menuController.createMenu);

router.post('/', auth, authorizeRoles(['admin']), menuController.createMenu);

router.put('/:id', auth, authorizeRoles(['admin']), menuController.updateMenu);

router.delete('/:id', menuController.deleteMenu);

export default router;