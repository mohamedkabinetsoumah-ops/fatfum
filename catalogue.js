/* Catalogue en ligne — affichage. Tout le texte venu du catalogue est posé
   comme du texte, jamais comme du HTML. */

'use strict';

(function () {
  function h(balise, attributs, ...enfants) {
    const e = document.createElement(balise);
    for (const cle of Object.keys(attributs || {})) {
      const v = attributs[cle];
      if (v === undefined || v === null || v === false) continue;
      if (cle === 'clic') e.addEventListener('click', v);
      else if (cle === 'classe') e.className = v;
      else e.setAttribute(cle, v === true ? '' : v);
    }
    for (const enfant of enfants.flat()) if (enfant !== null && enfant !== undefined && enfant !== false) e.append(enfant);
    return e;
  }
  const vider = e => { while (e.firstChild) e.removeChild(e.firstChild); return e; };
  const montant = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' GNF';
  const titre = a => a.nom + (a.taille ? ' — ' + a.taille : '') + (a.couleur ? ' — ' + a.couleur : '');
  const sansAccent = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  let catalogue = null, categorie = '';
  const grille = document.getElementById('grille'), etat = document.getElementById('etat');
  const recherche = document.getElementById('recherche'), fiche = document.getElementById('fiche');

  /* Numéro WhatsApp de la boutique : 9 chiffres = numéro guinéen. */
  function numero() {
    let n = String(catalogue.boutique.telephone || '').split(/[\/,;]/)[0].replace(/\D/g, '');
    if (n.length === 9) n = '224' + n;
    return n;
  }
  function lienCommande(a) {
    const texte = a
      ? 'Bonjour ' + catalogue.boutique.nom + ', je suis intéressé(e) par : ' + titre(a) + (a.prix !== undefined ? ' (' + montant(a.prix) + ')' : '') + '. Est-ce disponible ?'
      : 'Bonjour ' + catalogue.boutique.nom + ', j’ai vu votre catalogue en ligne et je souhaite un renseignement.';
    return 'https://wa.me/' + numero() + '?text=' + encodeURIComponent(texte);
  }
  function boutonCommande(a, classe) {
    if (!numero()) return null;
    return h('a', { classe: 'bouton ' + (classe || ''), href: lienCommande(a), target: '_blank', rel: 'noopener' }, a ? 'Commander par WhatsApp' : 'Nous écrire sur WhatsApp');
  }
  function image(a, classe) {
    return a.image ? h('img', { classe: classe, src: a.image, alt: titre(a), loading: 'lazy' }) : h('div', { classe: classe + ' sans-photo', 'aria-hidden': 'true' }, a.nom.slice(0, 1).toUpperCase());
  }
  function etiquette(a) {
    if (a.prestation) return h('span', { classe: 'etiquette' }, 'Prestation');
    return a.disponible ? h('span', { classe: 'etiquette ok' }, 'Disponible') : h('span', { classe: 'etiquette non' }, 'Sur commande');
  }

  function ouvrir(a) {
    vider(fiche).append(h('div', { classe: 'fiche', role: 'dialog', 'aria-modal': 'true' },
      h('button', { classe: 'croix', type: 'button', 'aria-label': 'Fermer', clic: fermer }, '×'),
      image(a, 'grande'),
      h('div', { classe: 'fiche-texte' }, a.categorie && h('p', { classe: 'categorie' }, a.categorie), h('h2', {}, titre(a)),
        a.prix !== undefined && h('p', { classe: 'prix' }, montant(a.prix)), etiquette(a), boutonCommande(a, 'large'))));
    fiche.hidden = false;
  }
  function fermer() { fiche.hidden = true; vider(fiche); }
  fiche.addEventListener('click', e => { if (e.target === fiche) fermer(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fermer(); });

  function dessiner() {
    const q = sansAccent(recherche.value.trim());
    const visibles = catalogue.articles.filter(a => (!categorie || a.categorie === categorie) && (!q || sansAccent(titre(a) + ' ' + a.categorie).includes(q)));
    vider(grille);
    etat.hidden = visibles.length > 0;
    etat.textContent = catalogue.articles.length ? 'Aucun article ne correspond à votre recherche.' : 'Le catalogue sera bientôt en ligne.';
    for (const a of visibles) {
      grille.append(h('button', { classe: 'carte', type: 'button', clic: () => ouvrir(a) },
        image(a, 'photo'), h('span', { classe: 'nom' }, titre(a)), a.prix !== undefined && h('span', { classe: 'prix' }, montant(a.prix)), etiquette(a)));
    }
  }

  function dessinerCategories() {
    const zone = vider(document.getElementById('categories'));
    const noms = [...new Set(catalogue.articles.map(a => a.categorie).filter(Boolean))];
    if (noms.length < 2) return;
    for (const nom of [''].concat(noms)) {
      zone.append(h('button', { classe: 'puce' + (categorie === nom ? ' actif' : ''), type: 'button', clic: () => { categorie = nom; dessinerCategories(); dessiner(); } }, nom || 'Tout'));
    }
  }

  fetch('catalogue.json', { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(donnees => {
    catalogue = donnees;
    const b = catalogue.boutique;
    vider(document.getElementById('pied')).append(
      h('strong', {}, b.nom), b.activites && h('span', {}, b.activites),
      (b.adresse || b.telephone) && h('span', {}, [b.adresse, b.telephone && 'Tél. ' + b.telephone].filter(Boolean).join(' — ')),
      boutonCommande(null, 'clair'));
    recherche.addEventListener('input', dessiner);
    dessinerCategories();
    dessiner();
  }).catch(() => { etat.textContent = 'Le catalogue n’a pas pu être chargé. Vérifiez votre connexion et rechargez la page.'; });
})();
