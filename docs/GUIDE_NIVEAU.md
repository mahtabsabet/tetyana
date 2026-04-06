# Guide du développeur de niveau
## Les Aventures de Madame Tetyana

Bienvenue dans l'équipe ! Ce guide explique comment construire votre niveau.

---

## Étape 1 — Copiez le dossier modèle

```
src/levels/_template/   ← copiez ce dossier
src/levels/levelXX-votreniveau/  ← nommez-le comme ça
```

Remplacez `XX` par le numéro de votre niveau (01, 02, 03, etc.) et `votreniveau` par le thème (ex: `foret`, `ocean`).

---

## Étape 2 — Éditez `index.js`

Changez les valeurs marquées `TODO` :

```js
meta: {
  id: 'level01-foret',          // Identifiant unique de votre niveau
  titleFR: 'La Forêt Enchantée', // Titre en français
  descriptionFR: 'Aide Madame Tetyana à traverser la forêt !', // Description courte
  order: 1,                     // Ordre sur la carte (1 à 6)
}
```

---

## Étape 3 — Éditez `LevelScene.js`

### 3.1 Arrière-plan

Placez votre image de fond dans `assets/backgrounds/`, puis chargez-la :

```js
preload() {
  this.load.image('foret_bg', new URL('./assets/backgrounds/foret_bg.png', import.meta.url).href);
}

create() {
  this.add.image(W / 2, H / 2, 'foret_bg').setDisplaySize(W * 2, H);
}
```

**Taille recommandée pour l'arrière-plan :** 1920 × 540 pixels (ou dessin scanné recadré).

---

### 3.2 Plateformes

Ajoutez des plateformes où Madame Tetyana peut sauter :

```js
// Dans create(), après la création du sol :
this._plateforme(platforms, 400, H - 140, 200);  // x, y, largeur
this._plateforme(platforms, 700, H - 240, 160);
this._plateforme(platforms, 1000, H - 180, 180);
```

**Conseil :** Placez les plateformes pour que Madame Tetyana puisse avancer de gauche à droite.

---

### 3.3 Collectibles

Placez des objets à ramasser (pièces, bananes, étoiles…) :

```js
// Chargez votre sprite :
this.load.image('foret_coin', new URL('./assets/sprites/banane.png', import.meta.url).href);

// Puis dans create() :
const coin = this._coins.create(300, H - 160, 'foret_coin');
```

Ou utilisez un emoji si vous n'avez pas encore de dessin :
```js
const coin = this.add.text(300, H - 160, '🍌', { fontSize: '28px' }).setOrigin(0.5);
this.physics.add.existing(coin, true);
this._coins.add(coin);
```

**Taille recommandée pour les sprites :** 64 × 64 pixels.

---

### 3.4 But du niveau

Le trophée 🏆 est déjà placé à la fin. Remplacez-le par votre dessin :

```js
this._goal = this.add.image(1820, H - 80, 'foret_goal');
this.physics.add.existing(this._goal, true);
```

---

### 3.5 Ennemis (optionnel)

Pour ajouter un ennemi simple (il touche le joueur et fait mal) :

```js
// Dans create() :
const ennemi = this.physics.add.image(600, H - 80, 'foret_grenouille');
ennemi.setVelocityX(-80);
ennemi.setBounce(1);
ennemi.setCollideWorldBounds(true);

this.physics.add.collider(this._player.sprite, ennemi, () => {
  this._player.takeDamage();
});
```

---

## Étape 4 — Préparez vos images

### Pipeline dessin → jeu

1. Les élèves dessinent sur papier blanc
2. Photographiez ou scannez à **300 dpi minimum**
3. Supprimez le fond blanc (utilisez [remove.bg](https://remove.bg) ou GIMP)
4. Sauvegardez en **PNG** avec fond transparent
5. Redimensionnez (voir tailles recommandées ci-dessous)
6. Placez dans le dossier `assets/` de votre niveau

### Tailles recommandées

| Asset | Taille | Dossier |
|---|---|---|
| Arrière-plan | 1920 × 540 px | `assets/backgrounds/` |
| Personnage / ennemi | 64 × 64 px | `assets/sprites/` |
| Collectible | 48 × 48 px | `assets/sprites/` |
| But du niveau | 80 × 80 px | `assets/sprites/` |
| Vignette (carte) | 72 × 72 px | `assets/sprites/` |

---

## Étape 5 — Ajoutez votre niveau au jeu

Dans `src/main.js`, ajoutez **une ligne** :

```js
// Décommentez votre niveau :
import level01 from './levels/level01-foret/index.js';

// Ajoutez-le au tableau LEVELS :
const LEVELS = [
  level01,
  // level02,
  // ...
];
```

---

## Règles importantes

- **Ne touchez jamais** les fichiers en dehors de votre dossier `levels/levelXX-*/`
- **Préfixez** toutes vos clés de texture avec votre id de niveau (ex: `foret_bg`, pas juste `bg`) pour éviter les conflits
- **Un seul import** à ajouter dans `main.js` — c'est tout !

---

## Vocabulaire français utile par niveau

### Niveau 1 — La Forêt Enchantée
le singe, le perroquet, la grenouille, le jaguar, la banane, l'arbre, la fleur, le champignon

### Niveau 2 — L'Océan Mystérieux
le requin, la pieuvre, le dauphin, le corail, la perle, la méduse, le poisson, le crabe

### Niveau 3 — L'Aventure dans l'Espace
la lune, la planète, la comète, l'astronaute, l'étoile, la fusée, le robot, le satellite

### Niveau 4 — Le Château Hanté
le fantôme, la porte, le miroir, la bibliothèque, le couloir, la bougie, la clé, la fenêtre

### Niveau 5 — Le Volcan du Dragon
le dragon, le feu, la lave, la gemme, la montagne, les flammes, le trésor, la vapeur

### Niveau 6 — La Toundra Arctique
la neige, la glace, le vent, le blizzard, le phoque, le pingouin, le flocon, le manteau

---

## Besoin d'aide ?

Consultez `src/levels/level01-foret/LevelScene.js` — c'est un niveau complet et commenté.
Le code de `_template/LevelScene.js` a aussi beaucoup de commentaires explicatifs.
