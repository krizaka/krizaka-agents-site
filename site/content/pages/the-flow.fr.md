---
title: "Le flux : du ticket à la pull request fusionnée"
description: "Comment un ticket devient une pull request fusionnée avec Krizaka Agents : une session vérifiée, des refus avant le push, un train, une merge queue."
---

### § 1 — Du ticket à l'alerte, en sept stations

Tout part d'un ticket, rangé sur un tableau, avec une voie (une session à la fois par voie) et un « terminé quand ».
Le ticket suit le besoin ; la **tâche** est ce qui s'exécute, bornée avant de commencer : S, 60 tours au plus ; M, 120 ;
une tâche L est refusée avec une seule consigne, la découper.

*Fig. 1 — Le flux : ticket → session construite et vérifiée → refus avant le push → pull request → train et fusion → recette → alertes.*

### § 2 — Une session construite et vérifiée

<!--view:agents_containers-->

Une session n'a pas d'écran et personne à qui poser une question : elle a un ticket, une consigne et des plafonds. Le
lanceur la démarre toujours pareil : isolée (elle ne voit que l'index du code et les outils déclarés), épinglée (la
version de Claude Code ne bouge que par pull request), vérifiée deux fois (la machine avant le départ, puis ce que la
session a vraiment chargé à son premier message). Un écart, et elle s'arrête avec la raison.

### § 3 — Le coordinateur

Un coordinateur sans modèle attribue les tâches, avec un bail qui expire, un battement de cœur renouvelé par le lanceur
(pas par l'agent) et un jeton qui monte à chaque nouveau bail : une session figée ne peut plus livrer. Le périmètre d'une
tâche est tenu à quatre endroits, aucun dans l'agent. Honnêtement : aujourd'hui, un seul dépôt local est sous
coordinateur ; pour les dépôts GitHub, deux sessions sont tenues à part par un worktree par ticket et par le refus
d'ouvrir une pull request qui touche un fichier déjà touché par une autre.

### § 4 — Le train et la merge queue

Une session ne fusionne jamais. Elle ouvre sa pull request avec une commande, puis la met dans le train du dépôt : une
file et un script qui la vide, sans jeton. Le train prend la tête, la rebase sur main, attend les contrôles requis et
l'envoie dans la merge queue de GitHub, qui rejoue les contrôles sur le vrai mélange avec main. Une tête rouge est sautée,
avec sa raison. Un main rouge gèle les fusions du dépôt jusqu'à ce qu'un `fix` passe.

<!--view:pr_life-->

### § 5 — Après la fusion

Une session de recette vérifie le ticket après la fusion ; le lanceur est le même, il n'y a pas de second chemin. Les
alertes vont dans une seule table, avec un propriétaire et une preuve (page « Alertes et le veilleur »).

### Ce qui est mesuré

- Un chevauchement de fichiers touchait près de la moitié des pull requests ouvertes (826 sur 1 782).
- Les trains ont fusionné 92 pull requests en 48 heures, et en ont sauté 37, chacune avec sa raison.
- Une session démarre avec environ 40 000 jetons de contexte au premier tour, contre environ 190 000 avant.

[Le récit complet : des agents sous un coordinateur →](https://blog.krizaka.com/fr/story/agents-under-a-coordinator/)
