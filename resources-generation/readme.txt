1. Que font ces scripts ?
Ces scripts PHP permettent de générer automatiquement les ressources utiles à JSrealB (en anglais et français) à partir
des lexiques de SimpleNLG-EnFr (fichiers XML), et des dictionnaires morphologiques (fichiers textes), tout est dans app/data/.

2. Lancer la génération des ressources pour JSrealB (lexique, table de règles et liste des constantes "feature")
=> Exécuter french.php pour le français et english.php pour l'anglais

3. Modifier la génération des ressources
=> Tout se passe au niveau des services qui appellent des outils pour transformer 
les fichiers de données (textes ou XML) en fichiers JSON, voir app/service/, app/tool/ et app/xsl/