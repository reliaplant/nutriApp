/* eslint-disable */
// Genera src/app/shared/bdd.taco.refeit.json a partir de TACO.json.
// Uso: node scripts/build-foods-db.js

const fs = require('fs');
const path = require('path');

const TACO = require(path.join(__dirname, '..', 'src', 'app', 'shared', 'TACO.json'));
const OUT = path.join(__dirname, '..', 'src', 'app', 'shared', 'bdd.taco.refeit.json');

// ─── Traducciones PT → ES (manuales) ────────────────────────────────────────
const NAMES_ES = {
  // Cereais e derivados
  1: 'Arroz integral cocido', 2: 'Arroz integral crudo',
  3: 'Arroz blanco tipo 1, cocido', 4: 'Arroz blanco tipo 1, crudo',
  5: 'Arroz blanco tipo 2, cocido', 6: 'Arroz blanco tipo 2, crudo',
  7: 'Avena en hojuelas, cruda',
  8: 'Galleta dulce de maicena',
  9: 'Galleta dulce rellena de chocolate', 10: 'Galleta dulce rellena de fresa',
  11: 'Galleta wafer rellena de chocolate', 12: 'Galleta wafer rellena de fresa',
  13: 'Galleta salada (cream cracker)',
  14: 'Mezcla para pastel',
  15: 'Pastel de yuca', 16: 'Pastel de chocolate', 17: 'Pastel de coco', 18: 'Pastel de maíz',
  19: 'Maíz blanco para canjica, crudo', 20: 'Canjica con leche entera',
  21: 'Cereal de maíz en hojuelas, con sal', 22: 'Cereal de maíz en hojuelas, sin sal',
  23: 'Papilla infantil de maíz',
  24: 'Mezcla para batido (trigo, cebada y avena)',
  25: 'Cereal de desayuno de maíz', 26: 'Cereal de desayuno de maíz azucarado',
  27: 'Crema de arroz en polvo', 28: 'Crema de maíz en polvo',
  29: 'Curau de maíz tierno', 30: 'Mezcla para curau de maíz tierno',
  31: 'Harina de arroz enriquecida', 32: 'Harina de centeno integral',
  33: 'Harina de maíz amarilla', 34: 'Pan rallado', 35: 'Harina de trigo',
  36: 'Harina láctea de cereales',
  37: 'Lasaña, masa fresca, cocida', 38: 'Lasaña, masa fresca, cruda',
  39: 'Fideos instantáneos', 40: 'Pasta de trigo, cruda', 41: 'Pasta de trigo con huevo, cruda',
  42: 'Almidón de maíz (maicena)', 43: 'Harina de maíz (fubá), cruda',
  44: 'Maíz tierno, crudo', 45: 'Maíz tierno enlatado, escurrido',
  46: 'Papilla tradicional, en polvo', 47: 'Pamonha, barra precocida',
  48: 'Pan de molde de avena', 49: 'Pan de soya', 50: 'Pan de molde con gluten',
  51: 'Pan de molde de maíz', 52: 'Pan de molde integral',
  53: 'Pan francés (bolillo)', 54: 'Pan amasado de trigo',
  55: 'Empanada de carne, cruda', 56: 'Empanada de carne, frita',
  57: 'Empanada de queso, cruda', 58: 'Empanada de queso, frita',
  59: 'Masa para empanada, cruda', 60: 'Masa para empanada, frita',
  61: 'Palomitas con aceite de soya, sin sal', 62: 'Polenta precocida',
  63: 'Pan tostado (bolillo)',

  // Verduras, hortaliças e derivados
  64: 'Calabaza cabotian, cocida', 65: 'Calabaza cabotian, cruda',
  66: 'Calabaza menina, cruda', 67: 'Calabaza moranga, cruda', 68: 'Calabaza moranga salteada',
  69: 'Calabaza pescoço, cruda',
  70: 'Calabacita italiana, cocida', 71: 'Calabacita italiana, cruda',
  72: 'Calabacita italiana salteada', 73: 'Calabacita paulista, cruda',
  74: 'Acelga, cruda', 75: 'Berro, crudo', 76: 'Apio, crudo',
  77: 'Lechuga americana, cruda', 78: 'Lechuga crespa, cruda',
  79: 'Lechuga lisa, cruda', 80: 'Lechuga morada, cruda',
  81: 'Albahaca silvestre (alfavaca), cruda',
  82: 'Ajo, crudo', 83: 'Puerro, crudo',
  84: 'Achicoria amarga (almeirão), cruda', 85: 'Achicoria amarga (almeirão) salteada',
  86: 'Apio amarillo (baroa), cocido', 87: 'Apio amarillo (baroa), crudo',
  88: 'Camote/batata, cocido', 89: 'Camote/batata, crudo',
  90: 'Papas fritas tipo chips industrializadas',
  91: 'Papa inglesa, cocida', 92: 'Papa inglesa, cruda',
  93: 'Papa inglesa frita', 94: 'Papa inglesa salteada',
  95: 'Berenjena, cocida', 96: 'Berenjena, cruda',
  97: 'Betabel/remolacha, cocido', 98: 'Betabel/remolacha, crudo',
  99: 'Galleta de polvilho dulce',
  100: 'Brócoli, cocido', 101: 'Brócoli, crudo',
  102: 'Ñame cará, cocido', 103: 'Ñame cará, crudo',
  104: 'Bledo (caruru), crudo',
  105: 'Catalonia, cruda', 106: 'Catalonia salteada',
  107: 'Cebolla, cruda', 108: 'Cebollín, crudo',
  109: 'Zanahoria, cocida', 110: 'Zanahoria, cruda',
  111: 'Achicoria, cruda',
  112: 'Chayote, cocido', 113: 'Chayote, crudo',
  114: 'Cilantro, hojas deshidratadas',
  115: 'Col berza (manteiga), cruda', 116: 'Col berza salteada',
  117: 'Coliflor, cruda', 118: 'Coliflor, cocida',
  119: 'Espinaca de Nueva Zelanda, cruda', 120: 'Espinaca de Nueva Zelanda salteada',
  121: 'Harina de yuca, cruda', 122: 'Harina de yuca tostada',
  123: 'Harina de puba (yuca fermentada)', 124: 'Fécula de yuca',
  125: 'Brote de frijol, crudo',
  126: 'Ñame, crudo', 127: 'Jiló (berenjena amarga), crudo',
  128: 'Jurubeba, cruda',
  129: 'Yuca/mandioca, cocida', 130: 'Yuca/mandioca, cruda',
  131: 'Farofa de yuca sazonada', 132: 'Yuca/mandioca, frita',
  133: 'Albahaca, cruda', 134: 'Maxixe (pepinillo brasileño), crudo',
  135: 'Hoja de mostaza, cruda', 136: 'Ñoquis de papa, cocidos',
  137: 'Nabo, crudo',
  138: 'Palmito Juçara en conserva', 139: 'Palmito pupunha en conserva',
  140: 'Pan de queso, horneado', 141: 'Pan de queso, crudo',
  142: 'Pepino, crudo',
  143: 'Pimiento amarillo, crudo', 144: 'Pimiento verde, crudo', 145: 'Pimiento rojo, crudo',
  146: 'Polvilho dulce',
  147: 'Quimbombó/okra, crudo', 148: 'Rábano, crudo',
  149: 'Col blanca, cruda', 150: 'Col morada, cruda', 151: 'Col morada salteada',
  152: 'Arúgula, cruda', 153: 'Perejil, crudo',
  154: 'Mezcla de verduras enlatada',
  155: 'Cerraja, cruda', 156: 'Taioba (hoja brasileña), cruda',
  157: 'Tomate con semillas, crudo', 158: 'Pasta de tomate',
  159: 'Salsa de tomate industrializada', 160: 'Puré de tomate',
  161: 'Tomate ensalada', 162: 'Ejote, crudo',

  // Frutas e derivados
  163: 'Aguacate, crudo', 164: 'Piña, cruda', 165: 'Piña, pulpa congelada',
  166: 'Abiu, crudo',
  167: 'Açaí, pulpa con jarabe de guaraná y glucosa', 168: 'Açaí, pulpa congelada',
  169: 'Acerola, cruda', 170: 'Acerola, pulpa congelada',
  171: 'Ciruela en almíbar, enlatada', 172: 'Ciruela, cruda',
  173: 'Ciruela en almíbar, escurrida',
  174: 'Atemoya, cruda',
  175: 'Plátano macho, crudo', 176: 'Banana en barra dulce',
  177: 'Banana figo, cruda', 178: 'Banana manzana, cruda',
  179: 'Banana enana, cruda', 180: 'Banana oro, cruda',
  181: 'Banana pacova, cruda', 182: 'Banana prata, cruda',
  183: 'Cacao, crudo',
  184: 'Cajá-manga, crudo', 185: 'Cajá, pulpa congelada',
  186: 'Marañón (caju), crudo', 187: 'Marañón, pulpa congelada',
  188: 'Jugo concentrado de marañón',
  189: 'Caqui chocolate, crudo', 190: 'Carambola, cruda',
  191: 'Jocote (ciriguela), crudo',
  192: 'Cupuaçu, crudo', 193: 'Cupuaçu, pulpa congelada',
  194: 'Higo, crudo', 195: 'Higo enlatado en almíbar',
  196: 'Fruta de pan, cruda',
  197: 'Guayaba blanca con cáscara, cruda',
  198: 'Pasta dulce de guayaba (goiabada)', 199: 'Dulce de guayaba en cáscara',
  200: 'Guayaba roja con cáscara, cruda',
  201: 'Guanábana, cruda', 202: 'Guanábana, pulpa congelada',
  203: 'Jaboticaba, cruda', 204: 'Yaca, cruda',
  205: 'Jambo, crudo', 206: 'Jamelao (yamblón), crudo',
  207: 'Kiwi, crudo',
  208: 'Naranja bahía, cruda', 209: 'Jugo de naranja bahía',
  210: 'Naranja da terra, cruda', 211: 'Jugo de naranja da terra',
  212: 'Naranja lima, cruda', 213: 'Jugo de naranja lima',
  214: 'Naranja pera, cruda', 215: 'Jugo de naranja pera',
  216: 'Naranja valencia, cruda', 217: 'Jugo de naranja valencia',
  218: 'Jugo de limón cravo', 219: 'Jugo de lima gallega',
  220: 'Limón tahití, crudo',
  221: 'Manzana argentina con cáscara, cruda', 222: 'Manzana Fuji con cáscara, cruda',
  223: 'Macaúba (palma noli), cruda',
  224: 'Papaya en almíbar, escurrida',
  225: 'Papaya Formosa, cruda', 226: 'Papaya, cruda',
  227: 'Papaya verde en almíbar, escurrida',
  228: 'Mango Haden, crudo', 229: 'Mango Palmer, crudo',
  230: 'Mango, pulpa congelada', 231: 'Mango Tommy Atkins, crudo',
  232: 'Maracuyá, crudo', 233: 'Maracuyá, pulpa congelada',
  234: 'Jugo concentrado de maracuyá',
  235: 'Sandía, cruda', 236: 'Melón, crudo',
  237: 'Mandarina Murcote, cruda', 238: 'Mandarina Rio, cruda',
  239: 'Fresa, cruda', 240: 'Níspero, crudo',
  241: 'Pequi, crudo',
  242: 'Pera Park, cruda', 243: 'Pera Williams, cruda',
  244: 'Durazno Aurora, crudo', 245: 'Durazno enlatado en almíbar',
  246: 'Anona/chirimoya, cruda',
  247: 'Pitanga, cruda', 248: 'Pitanga, pulpa congelada',
  249: 'Granada, cruda', 250: 'Tamarindo, crudo',
  251: 'Mandarina Poncã, cruda', 252: 'Jugo de mandarina Poncã',
  253: 'Tucumã, crudo',
  254: 'Umbu, crudo', 255: 'Umbu, pulpa congelada',
  256: 'Uva Italia, cruda', 257: 'Uva Rubi, cruda',
  258: 'Jugo concentrado de uva',

  // Gorduras e óleos
  259: 'Aceite de palma (dendê)', 260: 'Aceite de oliva extra virgen',
  261: 'Mantequilla con sal', 262: 'Mantequilla sin sal',
  263: 'Margarina con aceite hidrogenado, con sal (65% lípidos)',
  264: 'Margarina con aceite hidrogenado, sin sal (80% lípidos)',
  265: 'Margarina con aceite interesterificado, con sal (65% lípidos)',
  266: 'Margarina con aceite interesterificado, sin sal (65% lípidos)',
  267: 'Aceite de babasú', 268: 'Aceite de canola',
  269: 'Aceite de girasol', 270: 'Aceite de maíz',
  271: 'Aceite de pequi', 272: 'Aceite de soya',

  // Pescados e frutos do mar
  273: 'Filete de abadejo congelado, horneado',
  274: 'Filete de abadejo congelado, cocido',
  275: 'Filete de abadejo congelado, crudo',
  276: 'Filete de abadejo congelado, a la plancha',
  277: 'Atún en aceite', 278: 'Atún fresco, crudo',
  279: 'Bacalao salado, crudo', 280: 'Bacalao salado, salteado',
  281: 'Cazón en filete, empanizado y frito',
  282: 'Cazón en filete, cocido', 283: 'Cazón en filete, crudo',
  284: 'Camarón grande Rio Grande, cocido',
  285: 'Camarón grande Rio Grande, crudo',
  286: 'Camarón sete barbas con cáscara, frito',
  287: 'Cangrejo, cocido',
  288: 'Corimba (sábalo), crudo',
  289: 'Corimbatá, horneado', 290: 'Corimbatá, cocido',
  291: 'Corvina de agua dulce, cruda', 292: 'Corvina de mar, cruda',
  293: 'Corvina grande, horneada', 294: 'Corvina grande, cocida',
  295: 'Dorada de agua dulce, fresca',
  296: 'Lambari congelado, crudo', 297: 'Lambari congelado, frito',
  298: 'Lambari fresco, crudo',
  299: 'Manjuba empanizada y frita', 300: 'Manjuba frita',
  301: 'Filete de merluza, horneado',
  302: 'Filete de merluza, crudo', 303: 'Filete de merluza, frito',
  304: 'Pescada blanca, cruda', 305: 'Pescada blanca, frita',
  306: 'Filete de pescada empanizado y frito',
  307: 'Filete de pescada, crudo', 308: 'Filete de pescada, frito',
  309: 'Filete de pescada en escabeche',
  310: 'Pescadilla, cruda',
  311: 'Pintado (pez), horneado', 312: 'Pintado (pez), crudo',
  313: 'Pintado (pez), a la plancha',
  314: 'Porquinho (pez), crudo',
  315: 'Filete de salmón con piel, a la plancha',
  316: 'Salmón sin piel, fresco, crudo',
  317: 'Salmón sin piel, fresco, a la plancha',
  318: 'Sardina, horneada', 319: 'Sardina en aceite',
  320: 'Sardina, frita', 321: 'Sardina entera, cruda',
  322: 'Filete de tucunaré congelado, crudo',

  // Carnes e derivados
  323: 'Jamón cocido tipo apresuntado',
  324: 'Caldo de res en cubo', 325: 'Caldo de pollo en cubo',
  326: 'Res, aguja molida, cocida', 327: 'Res, aguja molida, cruda',
  328: 'Res, aguja sin grasa, cocida', 329: 'Res, aguja sin grasa, cruda',
  330: 'Albóndigas de res, crudas', 331: 'Albóndigas de res, fritas',
  332: 'Pancita/mondongo de res, cocido', 333: 'Pancita/mondongo de res, crudo',
  334: 'Res, capa de contrafilete con grasa, cruda',
  335: 'Res, capa de contrafilete con grasa, a la plancha',
  336: 'Res, capa de contrafilete sin grasa, cruda',
  337: 'Res, capa de contrafilete sin grasa, a la plancha',
  338: 'Cecina/charqui de res, cocido', 339: 'Cecina/charqui de res, crudo',
  340: 'Res, contrafilete a la milanesa',
  341: 'Res, contrafilete de costilla, crudo',
  342: 'Res, contrafilete de costilla, a la plancha',
  343: 'Res, contrafilete con grasa, crudo',
  344: 'Res, contrafilete con grasa, a la plancha',
  345: 'Res, contrafilete sin grasa, crudo',
  346: 'Res, contrafilete sin grasa, a la plancha',
  347: 'Res, costilla horneada', 348: 'Res, costilla cruda',
  349: 'Res, bola/cuete sin grasa, cocido', 350: 'Res, bola/cuete sin grasa, crudo',
  351: 'Res, contramuslo sin grasa, cocido', 352: 'Res, contramuslo sin grasa, crudo',
  353: 'Res, joroba (cupim), horneada', 354: 'Res, joroba (cupim), cruda',
  355: 'Hígado de res, crudo', 356: 'Hígado de res, a la plancha',
  357: 'Res, filete miñón sin grasa, crudo',
  358: 'Res, filete miñón sin grasa, a la plancha',
  359: 'Res, flanco sin grasa, cocido', 360: 'Res, flanco sin grasa, crudo',
  361: 'Res, vacío con grasa, cocido', 362: 'Res, vacío con grasa, crudo',
  363: 'Res, peceto/lagarto, cocido', 364: 'Res, peceto/lagarto, crudo',
  365: 'Lengua de res, cocida', 366: 'Lengua de res, cruda',
  367: 'Res, colita de cuadril, cruda', 368: 'Res, colita de cuadril, a la plancha',
  369: 'Res, corazón de cuadril sin grasa, crudo',
  370: 'Res, corazón de cuadril sin grasa, a la plancha',
  371: 'Res, músculo/morcillo sin grasa, cocido',
  372: 'Res, músculo/morcillo sin grasa, crudo',
  373: 'Res, paleta con grasa, cruda',
  374: 'Res, paleta sin grasa, cocida', 375: 'Res, paleta sin grasa, cruda',
  376: 'Res, bola de lomo sin grasa, cruda',
  377: 'Res, bola de lomo sin grasa, a la plancha',
  378: 'Res, pecho sin grasa, cocido', 379: 'Res, pecho sin grasa, crudo',
  380: 'Res, picaña con grasa, cruda', 381: 'Res, picaña con grasa, a la plancha',
  382: 'Res, picaña sin grasa, cruda', 383: 'Res, picaña sin grasa, a la plancha',
  384: 'Carne seca de res, cocida', 385: 'Carne seca de res, cruda',
  386: 'Coxinha de pollo, frita',
  387: 'Croqueta de carne, cruda', 388: 'Croqueta de carne, frita',
  389: 'Empanada de pollo precocida, horneada',
  390: 'Empanada de pollo, precocida',
  391: 'Pollo, ala con piel, cruda',
  392: 'Pollo de campo entero con piel, cocido',
  393: 'Pollo de campo entero sin piel, cocido',
  394: 'Corazón de pollo, crudo', 395: 'Corazón de pollo, a la plancha',
  396: 'Pollo, muslo con piel, horneado', 397: 'Pollo, muslo con piel, crudo',
  398: 'Pollo, muslo sin piel, cocido', 399: 'Pollo, muslo sin piel, crudo',
  400: 'Hígado de pollo, crudo',
  401: 'Filete de pollo a la milanesa',
  402: 'Pollo entero con piel, crudo',
  403: 'Pollo entero sin piel, horneado',
  404: 'Pollo entero sin piel, cocido',
  405: 'Pollo entero sin piel, crudo',
  406: 'Pechuga de pollo con piel, horneada',
  407: 'Pechuga de pollo con piel, cruda',
  408: 'Pechuga de pollo sin piel, cocida',
  409: 'Pechuga de pollo sin piel, cruda',
  410: 'Pechuga de pollo sin piel, a la plancha',
  411: 'Encuentro de pollo con piel, horneado',
  412: 'Encuentro de pollo con piel, crudo',
  413: 'Encuentro de pollo sin piel, horneado',
  414: 'Encuentro de pollo sin piel, crudo',
  415: 'Hamburguesa de res, cruda', 416: 'Hamburguesa de res, frita',
  417: 'Hamburguesa de res, a la plancha',
  418: 'Salchicha de pollo, cruda', 419: 'Salchicha de pollo, frita',
  420: 'Salchicha de pollo, a la plancha',
  421: 'Salchicha de cerdo, cruda', 422: 'Salchicha de cerdo, frita',
  423: 'Salchicha de cerdo, a la plancha',
  424: 'Mortadela',
  425: 'Pavo congelado, horneado', 426: 'Pavo congelado, crudo',
  427: 'Cerdo, chuleta, cruda', 428: 'Cerdo, chuleta, frita',
  429: 'Cerdo, chuleta, a la plancha',
  430: 'Cerdo, costilla, horneada', 431: 'Cerdo, costilla, cruda',
  432: 'Cerdo, lomo, horneado', 433: 'Cerdo, lomo, crudo',
  434: 'Cerdo, oreja salada, cruda',
  435: 'Cerdo, pernil, horneado', 436: 'Cerdo, pernil, crudo',
  437: 'Cerdo, rabo salado, crudo',
  438: 'Jamón con capa de grasa', 439: 'Jamón sin capa de grasa',
  440: 'Kibbeh, horneado', 441: 'Kibbeh, crudo', 442: 'Kibbeh, frito',
  443: 'Salame',
  444: 'Tocino, crudo', 445: 'Tocino, frito',

  // Leite e derivados
  446: 'Bebida láctea de durazno', 447: 'Crema de leche',
  448: 'Yogur natural', 449: 'Yogur natural descremado',
  450: 'Yogur sabor piña', 451: 'Yogur sabor fresa', 452: 'Yogur sabor durazno',
  453: 'Leche condensada', 454: 'Leche de cabra',
  455: 'Leche de vaca con chocolate',
  456: 'Leche de vaca descremada, en polvo', 457: 'Leche de vaca descremada, UHT',
  458: 'Leche de vaca entera', 459: 'Leche de vaca entera, en polvo',
  460: 'Leche fermentada',
  461: 'Queso fresco minas', 462: 'Queso minas semicurado',
  463: 'Queso mozzarella', 464: 'Queso parmesano',
  465: 'Queso pasteurizado',
  466: 'Queso petit suisse, fresa',
  467: 'Queso prato',
  468: 'Maria mole (dulce de coco)',
  469: 'Requesón/ricotta',

  // Bebidas
  470: 'Bebida isotónica, varios sabores',
  471: 'Café, infusión 10%',
  472: 'Aguardiente de caña', 473: 'Jugo de caña',
  474: 'Cerveza pilsen',
  475: 'Té de hinojo, infusión 5%', 476: 'Té mate, infusión 5%',
  477: 'Té negro, infusión 5%',
  478: 'Agua de coco',
  479: 'Refresco tipo agua tónica', 480: 'Refresco tipo cola',
  481: 'Refresco tipo guaraná', 482: 'Refresco tipo naranja',
  483: 'Refresco tipo limón',

  // Ovos e derivados
  484: 'Omelette de queso',
  485: 'Huevo de codorniz entero, crudo',
  486: 'Huevo de gallina, clara cocida 10 min',
  487: 'Huevo de gallina, yema cocida 10 min',
  488: 'Huevo de gallina entero, cocido 10 min',
  489: 'Huevo de gallina entero, crudo',
  490: 'Huevo de gallina entero, frito',

  // Produtos açucarados
  491: 'Chocolate en polvo (achocolatado)',
  492: 'Azúcar cristal', 493: 'Azúcar mascabado', 494: 'Azúcar refinada',
  495: 'Chocolate con leche',
  496: 'Chocolate con leche y castaña de Pará',
  497: 'Chocolate con leche dietético', 498: 'Chocolate semiamargo',
  499: 'Cocada blanca',
  500: 'Dulce de calabaza cremoso', 501: 'Dulce de leche cremoso',
  502: 'Gelatina natural de mocotó',
  503: 'Glucosa de maíz',
  504: 'Maria mole', 505: 'Maria mole con coco quemado',
  506: 'Carne de membrillo (marmelada)',
  507: 'Miel de abeja', 508: 'Melaza',
  509: 'Quindim (dulce brasileño)', 510: 'Rapadura/panela',

  // Miscelâneas
  511: 'Café tostado en polvo', 512: 'Capuchino en polvo',
  513: 'Polvo para hornear químico',
  514: 'Levadura biológica en tableta',
  515: 'Gelatina en polvo, varios sabores',
  516: 'Sal dietética', 517: 'Sal gruesa',
  518: 'Salsa de soya (shoyu)',
  519: 'Sazonador a base de sal',

  // Outros alimentos industrializados
  520: 'Aceitunas negras en conserva', 521: 'Aceitunas verdes en conserva',
  522: 'Crema chantilly en spray con grasa vegetal',
  523: 'Leche de coco',
  524: 'Mayonesa tradicional con huevo',

  // Alimentos preparados
  525: 'Acarajé', 526: 'Arroz carreteiro',
  527: 'Baião de dois (arroz y caupí)',
  528: 'Barreado (guiso brasileño)',
  529: 'Bife a caballo con contrafilete',
  530: 'Bolinho de arroz',
  531: 'Camarón a la bahiana',
  532: 'Hojas de col rellenas',
  533: 'Cuscús de maíz cocido con sal', 534: 'Cuscús paulista',
  535: 'Salsa cuxá',
  536: 'Dobladilla (mondongo)',
  537: 'Strogonoff de carne', 538: 'Strogonoff de pollo',
  539: 'Feijão tropeiro', 540: 'Feijoada',
  541: 'Pollo con azafrán',
  542: 'Pasta con salsa boloñesa',
  543: 'Maniçoba',
  544: 'Quibebe (puré de calabaza)',
  545: 'Ensalada de verduras con mayonesa',
  546: 'Ensalada de verduras al vapor',
  547: 'Salpicón de pollo',
  548: 'Sarapatel',
  549: 'Tabulé', 550: 'Tacacá',
  551: 'Tapioca con mantequilla',
  552: 'Tucupi con pimienta de cheiro',
  553: 'Vaca atolada', 554: 'Vatapá',
  555: 'Virado a paulista', 556: 'Yakisoba',

  // Leguminosas e derivados
  557: 'Cacahuate en grano, crudo', 558: 'Cacahuate tostado salado',
  559: 'Chícharo/guisante en vaina', 560: 'Chícharo enlatado, escurrido',
  561: 'Frijol carioca, cocido', 562: 'Frijol carioca, crudo',
  563: 'Frijol caupí (fradinho), cocido', 564: 'Frijol caupí (fradinho), crudo',
  565: 'Frijol jalo, cocido', 566: 'Frijol jalo, crudo',
  567: 'Frijol negro, cocido', 568: 'Frijol negro, crudo',
  569: 'Frijol rayado, cocido', 570: 'Frijol rayado, crudo',
  571: 'Frijol rosinha, cocido', 572: 'Frijol rosinha, crudo',
  573: 'Frijol morado, cocido', 574: 'Frijol morado, crudo',
  575: 'Garbanzo, crudo', 576: 'Gandul, crudo',
  577: 'Lenteja, cocida', 578: 'Lenteja, cruda',
  579: 'Paçoca de cacahuate', 580: 'Pé-de-moleque de cacahuate',
  581: 'Harina de soya', 582: 'Extracto de soya soluble, fluido',
  583: 'Extracto de soya soluble, en polvo',
  584: 'Tofu (queso de soya)',
  585: 'Altramuz, crudo', 586: 'Altramuz en conserva',

  // Nozes e sementes
  587: 'Almendra tostada salada',
  588: 'Anacardo tostado salado',
  589: 'Castaña de Brasil, cruda',
  590: 'Coco, crudo', 591: 'Coco verde, crudo',
  592: 'Harina de mesocarpio de babasú, cruda',
  593: 'Semilla de ajonjolí (sésamo)',
  594: 'Semilla de linaza',
  595: 'Piñón cocido', 596: 'Pupunha cocida',
  597: 'Nuez cruda',
};

// ─── Categorías PT → ES ─────────────────────────────────────────────────────
const CATEGORIES_ES = {
  'Cereais e derivados': 'Cereales y derivados',
  'Verduras, hortaliças e derivados': 'Verduras y hortalizas',
  'Frutas e derivados': 'Frutas y derivados',
  'Gorduras e óleos': 'Grasas y aceites',
  'Pescados e frutos do mar': 'Pescados y mariscos',
  'Carnes e derivados': 'Carnes y derivados',
  'Leite e derivados': 'Lácteos',
  'Bebidas (alcoólicas e não alcoólicas)': 'Bebidas',
  'Ovos e derivados': 'Huevos y derivados',
  'Produtos açucarados': 'Productos azucarados',
  'Miscelâneas': 'Misceláneos',
  'Outros alimentos industrializados': 'Industrializados',
  'Alimentos preparados': 'Platillos preparados',
  'Leguminosas e derivados': 'Legumbres',
  'Nozes e sementes': 'Frutos secos y semillas',
};

// ─── Mapping de iconos por keyword ──────────────────────────────────────────
function getIcon(name) {
  const n = name.toLowerCase();
  // Arroz / cereales
  if (/\barroz\b|\bfubá\b|polenta|canjica/.test(n)) return 'arroz';
  if (/aveia|grão|cevada|granola|farinha\s+de\s+(centeio|trigo|rosca)|trigo|maiz|fubá|amido|maicena/.test(n) && !/banana|mandioca|soja|coco/.test(n)) return 'grano';
  if (/biscoito|galleta/.test(n)) return 'galleta';
  if (/pão|pan\b|torrada|tostada/.test(n) && !/queijo|queso/.test(n)) return 'pan';
  if (/macarrão|pasta\b|lasanha|lasaña|nhoque|ñoqui|fideo/.test(n)) return 'pasta';
  if (/farinha|harina/.test(n) && !/mandioca|yuca|soja|babaçu|babasú|de\s+puba/.test(n)) return 'harina';
  if (/bolo|pastel\s+de|pastel,/.test(n)) return 'pan';
  if (/cereal|mingau|papilla/.test(n)) return 'grano';
  if (/pamonha|tapioca|farofa/.test(n)) return 'arroz';
  if (/cuscuz|cuscús/.test(n)) return 'arroz';

  // Verduras
  if (/abóbora|moranga|cabotian|calabaza/.test(n)) return 'calabaza';
  if (/abobrinha|calabacita/.test(n)) return 'calabacita';
  if (/lechuga|alface/.test(n)) return 'lechuga';
  if (/brócoli|brócolis/.test(n)) return 'brocoli';
  if (/coliflor|couve-flor/.test(n)) return 'coliflor';
  if (/couve|col\b|repolho/.test(n)) return 'col_rizada';
  if (/\bajo\b|alho/.test(n)) return 'ajo';
  if (/puerro|alho-poró|cebollín|cebolinha/.test(n)) return 'puerro';
  if (/papa|batata,?\s+inglesa|chips/.test(n) && !/doce|camote|baroa/.test(n)) return 'papa';
  if (/camote|batata.*doce|batata,\s+doce/.test(n)) return 'camote';
  if (/baroa/.test(n)) return 'apio';
  if (/berenjena|berinjela|jiló/.test(n)) return 'berenjena';
  if (/betabel|beterraba|remolacha/.test(n)) return 'betabel';
  if (/zanahoria|cenoura/.test(n)) return 'zanahoria';
  if (/apio|aipo/.test(n)) return 'apio';
  if (/coliflor/.test(n)) return 'coliflor';
  if (/espinaca|espinafre/.test(n)) return 'espinaca';
  if (/perejil|salsa,\s+crud|cilantro|coentro/.test(n)) return 'arugula';
  if (/arúgula|rúcula/.test(n)) return 'arugula';
  if (/pepino/.test(n)) return 'pepino';
  if (/pimiento|pimentão/.test(n)) return 'pimiento';
  if (/rábano|rabanete/.test(n)) return 'rabano';
  if (/nabo/.test(n)) return 'nabo';
  if (/quimbombó|quiabo|okra/.test(n)) return 'verdura_generica';
  if (/cebolla|cebola/.test(n)) return 'cebolla';
  if (/tomate/.test(n)) return 'tomate';
  if (/ejote|vagem/.test(n)) return 'ejote';
  if (/yuca|mandioca|ñame|inhame|cará|aipim/.test(n)) return 'camote';
  if (/elote|maíz\s+tierno|milho.*verde/.test(n)) return 'elote';
  if (/palmito/.test(n)) return 'verdura_generica';
  if (/acelga|berro|agrião|almeirão|catalonia|achicoria|chicória|maxixe|mostarda|serralha|taioba|alfavaca|albahaca|manjericão/.test(n)) return 'verdura_generica';
  if (/chayote|chuchu|caruru|jurubeba/.test(n)) return 'verdura_generica';
  if (/seleta\s+de\s+legumes|verduras\s+enlatada|ensalada\s+de\s+verduras/.test(n)) return 'verdura_generica';
  if (/polvilho|fécula/.test(n)) return 'harina';

  // Frutas
  if (/aguacate|abacate/.test(n)) return 'aguacate';
  if (/piña|abacaxi/.test(n)) return 'pina';
  if (/plátano\s+macho|banana\s+da\s+terra/.test(n)) return 'platano_macho';
  if (/plátano|banana/.test(n)) return 'platano';
  if (/manzana|maçã/.test(n)) return 'manzana';
  if (/pera|pêra/.test(n)) return 'pera';
  if (/durazno|pêssego/.test(n)) return 'durazno';
  if (/mango|manga/.test(n) && !/laranja\s+lima/.test(n)) return 'mango';
  if (/papaya|mamão/.test(n)) return 'papaya';
  if (/sandía|melancia/.test(n)) return 'sandia';
  if (/melón|melão/.test(n)) return 'melon';
  if (/fresa|morango/.test(n)) return 'fresa';
  if (/uva/.test(n)) return 'uva';
  if (/naranja|laranja/.test(n)) return 'naranja';
  if (/mandarina|tangerina|mexerica/.test(n)) return 'mandarina';
  if (/limón|limão|lima\b/.test(n)) return 'naranja';
  if (/kiwi/.test(n)) return 'kiwi';
  if (/granada|romã/.test(n)) return 'granada';
  if (/ciruela|ameixa/.test(n)) return 'ciruela';
  if (/cereza|cereja/.test(n)) return 'cereza';
  if (/higo|figo/.test(n)) return 'higo';
  if (/guayaba|goiaba|goiabada/.test(n)) return 'generico';
  if (/maracuyá|maracujá/.test(n)) return 'generico';
  if (/coco/.test(n)) return 'generico';
  if (/marañón|caju/.test(n)) return 'anacardo';
  if (/tamarindo|jaca|jambo|jamelao|jaboticaba|atemoya|abiu|açaí|acerola|cajá|caqui|carambola|cupuaçu|pequi|pinha|chirimoya|anona|pitanga|tucumã|umbu|nêspera|níspero|fruta\s+de\s+pan|guanábana|graviola|ciriguela|jocote|macaúba/.test(n)) return 'generico';
  if (/jugo|suco/.test(n)) return 'jugo';

  // Aceites y grasas
  if (/aceite|óleo|azeite/.test(n)) return 'aceite';
  if (/mantequilla|manteiga/.test(n)) return 'mantequilla';
  if (/margarina/.test(n)) return 'mantequilla';
  if (/aceituna|azeitona/.test(n)) return 'aceituna';

  // Pescados
  if (/atún|atum/.test(n)) return 'atun';
  if (/salmón|salmão/.test(n)) return 'salmon';
  if (/camarón|camarão/.test(n)) return 'camaron';
  if (/cangrejo|caranguejo/.test(n)) return 'cangrejo';
  if (/calamar|polvo|pulpo/.test(n)) return 'calamar';
  if (/langosta/.test(n)) return 'langosta';
  if (/vieira/.test(n)) return 'vieira';
  if (/abadejo|merluza|cazón|cação|pescada|pescadinha|corvina|corimba|dorada|lambari|manjuba|pintado|porquinho|sardina|sardinha|tucunaré|bacalao|bacalhau|filete|filé/.test(n)) return 'pescado';

  // Carnes
  if (/hígado|fígado/.test(n)) return 'bistec';
  if (/coração|corazón/.test(n)) return 'bistec';
  if (/pechuga|peito/.test(n) && /pollo|frango/.test(n)) return 'pechuga_pollo';
  if (/\bala\b|asa/.test(n) && /pollo|frango/.test(n)) return 'ala_pollo';
  if (/muslo|coxa|sobrecoxa|encuentro/.test(n) && /pollo|frango/.test(n)) return 'muslo_pollo';
  if (/pollo|frango|coxinha/.test(n)) return 'pechuga_pollo';
  if (/pavo|peru\b/.test(n)) return 'pechuga_pollo';
  if (/hamburguesa|hambúrguer|albóndiga|almôndega|kibbeh|quibe|croqueta|croquete/.test(n)) return 'carne_molida';
  if (/tocino|toucinho/.test(n)) return 'tocino';
  if (/salchicha|lingüiça|salame|mortadela|apresuntado/.test(n)) return 'salchicha';
  if (/jamón|presunto/.test(n)) return 'jamon';
  if (/chuleta|bisteca/.test(n)) return 'chuleta';
  if (/cerdo|porco/.test(n)) return 'chuleta';
  if (/res|bovina|bovino|carne\s+seca|charque|cecina|charqui|aguja|contrafilete|contra-filé|costela|costilla|cupim|filete\s+miñ|fraldinha|lagarto|maminha|alcatra|patinho|peito\s+sin|peito,\s+sem|picanha|picaña|coxão|paleta|músculo|flanco/.test(n)) return 'bistec';
  if (/caldo\s+de\s+(res|carne|pollo|galinha)/.test(n)) return 'condimento';

  // Lácteos
  if (/yogur|iogurte/.test(n)) return 'yogur';
  if (/queso|queijo|requesón|ricotta|ricota|mozzarella|mozarela|parmesano|parmesão|prato|petit suisse|minas/.test(n)) return 'queso';
  if (/leche|leite|crema\s+de\s+leche|creme\s+de\s+leite/.test(n)) return 'leche';
  if (/maria\s+mole/.test(n)) return 'leche';

  // Huevos
  if (/huevo|ovo|omelette|omelete|clara\s+coc|yema/.test(n)) return 'huevo';

  // Bebidas
  if (/café|capuchino|capuccino/.test(n)) return 'jugo';
  if (/té|chá/.test(n)) return 'jugo';
  if (/refresco|refrigerante|cerveza|cerveja|aguardiente|isotónica|cana,\s+caldo|coco,\s+água/.test(n)) return 'jugo';

  // Azúcares y dulces
  if (/azúcar|açúcar|miel|melado|melaza|rapadura|glucosa|glicose|chocolate|achocolatado|cocada|dulce|doce|geléia|gelatina|carne\s+de\s+membrillo|marmelada|quindim/.test(n)) return 'azucar';

  // Sal y condimentos
  if (/\bsal\b|shoyu|salsa\s+de\s+soya|tempero|sazonador|mayonesa|maionese|chantilly/.test(n)) return 'condimento';
  if (/levadura|fermento|polvo\s+para\s+hornear/.test(n)) return 'condimento';
  if (/extracto|pasta\s+de\s+tomate|salsa\s+de\s+tomate|puré\s+de\s+tomate|molho/.test(n)) return 'salsa';

  // Leguminosas
  if (/cacahuate|amendoim|paçoca|pé-de-moleque/.test(n)) return 'cacahuate';
  if (/frijol|feijão|caupí|broto/.test(n) && !/feijoada|tropeiro|baião/.test(n)) return 'frijol';
  if (/garbanzo|grão-de-bico/.test(n)) return 'garbanzo';
  if (/lenteja|lentilha/.test(n)) return 'lenteja';
  if (/chícharo|guisante|ervilha/.test(n)) return 'chicharos';
  if (/soja|tofu/.test(n)) return 'frijol';
  if (/altramuz|tremoço|gandul|guandu/.test(n)) return 'frijol';

  // Nueces y semillas
  if (/almendra|amêndoa/.test(n)) return 'almendra';
  if (/anacardo|castanha-de-caju/.test(n)) return 'anacardo';
  if (/castaña\s+de\s+brasil|castanha-do-brasil/.test(n)) return 'nuez';
  if (/nuez|noz/.test(n)) return 'nuez';
  if (/avellana/.test(n)) return 'avellana';
  if (/pistache|pistacho/.test(n)) return 'pistache';
  if (/piñón|pinhão/.test(n)) return 'pinon';
  if (/ajonjolí|sésamo|gergelim|linaza|linhaça|semilla|semente/.test(n)) return 'semilla';
  if (/pupunha|babasú|babaçu/.test(n)) return 'generico';

  // Platillos preparados / fallback
  if (/feijoada|tropeiro|baião|maniçoba|virado|tabulé|sarapatel|tacacá|vatapá|barreado|acarajé|carreteiro|bolinho|charuto|estrogonofe|strogonoff|salpicón|salada/.test(n)) return 'plato';

  return 'generico';
}

// ─── Helpers numéricos ──────────────────────────────────────────────────────
function num(v) {
  if (v === undefined || v === null || v === '') return null;
  if (v === 'NA' || v === 'Tr') return null;
  const n = Number(v);
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}

// ─── Build ──────────────────────────────────────────────────────────────────
const out = TACO.map((x) => {
  const name_es = NAMES_ES[x.id];
  if (!name_es) console.warn('⚠️  Falta traducción ES para id', x.id, '·', x.description);
  const cat_es = CATEGORIES_ES[x.category] || x.category;
  const baseName = (name_es || x.description).toLowerCase();
  const ptName = (x.description || '').toLowerCase();
  return {
    id: x.id,
    name_pt: x.description,
    name_es: name_es || x.description,
    category_pt: x.category,
    category_es: cat_es,
    kcal: num(x.energy_kcal),
    protein: num(x.protein_g),
    fat: num(x.lipid_g),
    carbs: num(x.carbohydrate_g),
    fiber: num(x.fiber_g),
    sodium_mg: num(x.sodium_mg),
    cholesterol_mg: num(x.cholesterol_mg),
    saturated_g: num(x.saturated_g),
    calcium_mg: num(x.calcium_mg),
    iron_mg: num(x.iron_mg),
    icon: getIcon(`${baseName} ${ptName}`),
  };
});

fs.writeFileSync(OUT, JSON.stringify(out, null, 0));
const sizeKB = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`✅ ${out.length} alimentos escritos en ${path.relative(process.cwd(), OUT)} (${sizeKB} KB)`);

// Estadísticas de iconos
const iconCounts = {};
out.forEach((f) => { iconCounts[f.icon] = (iconCounts[f.icon] || 0) + 1; });
const sorted = Object.entries(iconCounts).sort((a, b) => b[1] - a[1]);
console.log(`\n📊 Distribución de iconos (top 10):`);
sorted.slice(0, 10).forEach(([k, v]) => console.log(`  ${k.padEnd(20)} ${v}`));
console.log(`\n  Total iconos únicos: ${sorted.length}`);
console.log(`  "generico": ${iconCounts.generico || 0} (${(((iconCounts.generico || 0) / out.length) * 100).toFixed(1)}%)`);
