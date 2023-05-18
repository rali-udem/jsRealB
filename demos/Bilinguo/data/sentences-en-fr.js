const sentences=[
{
    id: 1,
    text: "J'aime jouer au ballon.  | I like playing ball. ",
    fr : ()=>
            root(V('aimer'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(V('jouer').t("b"),
                      comp(N('ballon').g("m").n("s"),
                           mod(P('à')).pos("pre"),
                           det(D('le').g("m").n("s"))))),
    en : ()=>
            root(V('like'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(V('play').t("pr"),
                      comp(N('ball').n("s")).pos("post"))),
    params:[]
},
{
    id: 2,
    text: "Mon chat est noir et blanc.  | My cat is black and white. ",
    fr : ()=>
            root(V('être'),
                 subj(N('chat').g("m").n("s"),
                      det(D('mon').pe(3).pe(1).n("s").ow("s"))),
                 coord(C('et'),
                       mod(A('noir').pos("post").g("m").n("s")),
                       mod(A('blanc').pos("post").g("m").n("s")))),
    en : ()=>
            root(V('be'),
                 subj(N('cat').n("s"),
                      mod(D('my').pe(1).n("s")).pos("pre")),
                 coord(C('and'),
                       mod(A('black')),
                       mod(A('white')))),
    params:[]
},
{
    id: 3,
    text: "Je mange des pommes tous les jours.  | I eat apples every day. ",
    fr : ()=>
            root(V('manger'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(N('pomme').g("f").n("p"),
                      mod(P('de')).pos("pre"),
                      det(D('le').n("p"))),
                 comp(N('jour').g("m").n("p"),
                      mod(A('tout').pos("post").g("m").n("p")).pos("pre"),
                      det(D('le').n("p")))),
    en : ()=>
            root(V('eat'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(N('apple').n("p")).pos("post"),
                 comp(N('day').n("s"),
                      det(D('every')))),
    params:[]
},
{
    id: 4,
    text: "Il fait bel aujourd'hui.  | It is nice weather today. ",
    fr : ()=>
            root(V('faire'),
                 subj(Pro('moi').c("nom").pe(3).g("m").n("s")),
                 comp(A('beau').pos("post").g("m").n("s")).pos("post"),
                 mod(Adv("aujourd'hui")).pos("post")),
    en : ()=>
            root(V('be'),
                 subj(Pro('it').c("nom").pe(3).g("n").n("s")),
                 comp(N('weather').n("s"),
                      mod(A('nice')).pos("pre"),
                      comp(N('today').n("s")).pos("post"))),
    params:[]
},
{
    id: 5,
    text: "J'ai une grande soeur.  | I have a big sister. ",
    fr : ()=>
            root(V('avoir'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(N('soeur').g("f").n("s"),
                      det(D('un').g("f").n("s")),
                      mod(A('grand').pos("post").g("f").n("s")).pos("pre"))),
    en : ()=>
            root(V('have'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(N('sister').n("s"),
                      det(D('a')),
                      mod(A('big')).pos("pre"))),
    params:[]
},
{
    id: 6,
    text: "Mon livre préféré est Harry Potter.  | My favourite book is Harry Potter. ",
    fr : ()=>
            root(V('être'),
                 subj(N('livre').g("m").n("s"),
                      det(D('mon').pe(3).pe(1).n("s").ow("s")),
                      mod(A('préféré').pos("post").g("m").n("s")).pos("post")),
                 comp(Q('Harry'),
                      mod(Q('Potter')).pos("post"))),
    en : ()=>
            root(V('be'),
                 subj(N('book').n("s"),
                      mod(D('my').pe(1).n("s")).pos("pre"),
                      mod(A('favourite')).pos("pre")),
                 comp(Q('Harry'),
                      mod(Q('Potter')).pos("post"))),
    params:[]
},
{
    id: 7,
    text: "Je suis content d'aller à l'école.  | I am happy to go to school. ",
    fr : ()=>
            root(V('être'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(A('content').pos("post").g("m").n("s"),
                      comp(V('aller').t("b"),
                           mod(P('de')).pos("pre"),
                           comp(N('école').g("f").n("s"),
                                mod(P('à')).pos("pre"),
                                det(D('le').n("s")))))),
    en : ()=>
            root(V('be'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(A('happy'),
                      comp(V('go').t("b").t("b-to"),
                           comp(N('school').n("s"),
                                mod(P('to')).pos("pre"))))),
    params:[]
},
{
    id: 8,
    text: "Mon père travaille dans un bureau.  | My father works in an office. ",
    fr : ()=>
            root(V('travailler'),
                 subj(N('père').g("m").n("s"),
                      det(D('mon').pe(3).pe(1).n("s").ow("s"))),
                 comp(N('bureau').g("m").n("s"),
                      mod(P('dans')).pos("pre"),
                      det(D('un').g("m").n("s")))),
    en : ()=>
            root(V('work'),
                 subj(N('father').n("s"),
                      mod(D('my').pe(1).n("s")).pos("pre")),
                 comp(N('office').n("s"),
                      mod(P('in')).pos("pre"),
                      det(D('a')))),
    params:[]
},
{
    id: 9,
    text: "Ma mère travaille très bien.  | My mother works very well. ",
    fr : ()=>
            root(V('travailler'),
                 subj(N('mère').g("f").n("s"),
                      det(D('mon').pe(3).pe(1).g("f").n("s").ow("s"))),
                 mod(Adv('bien'),
                     mod(Adv('très')).pos("pre"))),
    en : ()=>
            root(V('work'),
                 subj(N('mother').n("s"),
                      mod(D('my').pe(1).n("s")).pos("pre")),
                 mod(Adv('well'),
                     mod(Adv('very')).pos("pre"))),
    params:[]
},
{
    id: 10,
    text: "Je me vais coucher maintenant.  | I am go to bed now. ",
    fr : ()=>
            root(V('aller'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(V('coucher').t("b"),
                      comp(Pro('moi').c("refl").pe(1).n("s")).pos("pre"),
                      mod(Adv('maintenant')).pos("post"))),
    en : ()=>
            root(V('go'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 mod(V('be').t("p").pe(1).n("s")).pos("pre"),
                 comp(V('bed').t("b").t("b-to"),
                      mod(Adv('now')).pos("post"))),
    params:[]
},
{
    id: 11,
    text: "Je vais à la plage hier.  | I go to the beach yesterday. ",
    fr : ()=>
            root(V('aller'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(N('plage').g("f").n("s"),
                      mod(P('à')).pos("pre"),
                      det(D('le').g("f").n("s"))),
                 mod(Adv('hier')).pos("post")),
    en : ()=>
            root(V('go'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(N('beach').n("s"),
                      mod(P('to')).pos("pre"),
                      det(D('the'))),
                 comp(N('yesterday').n("s")).pos("post")),
    params:[]
},
{
    id: 12,
    text: "Mon chien s'appelle Max.  | Name my dog 's is Max. ",
    fr : ()=>
            root(V('appeler'),
                 subj(N('chien').g("m").n("s"),
                      det(D('mon').pe(3).pe(1).n("s").ow("s"))),
                 mod(Pro('moi').c("refl").pe(3)).pos("pre"),
                 comp(Q('Max')).pos("post")),
    en : ()=>
            root(V('be'),
                 subj(N('name').n("s"),
                      mod(N('dog').n("s"),
                          mod(D('my').pe(1).n("s")).pos("pre"),
                          mod(Q("'s")).pos("post"))),
                 comp(Q('Max')).pos("post")),
    params:[]
},
{
    id: 13,
    text: "J'aime manger des frites.  | I like eating French fries. ",
    fr : ()=>
            root(V('aimer'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(V('manger').t("b"),
                      comp(N('frite').g("f").n("p"),
                           det(D('un').n("p"))))),
    en : ()=>
            root(V('like'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(V('eat').t("pr"),
                      comp(N('fry').n("p"),
                           mod(A('French')).pos("pre")))),
    params:[]
},
{
    id: 14,
    text: "Il y a un arc-en-ciel dans le ciel.  | There a rainbow is in the sky. ",
    fr : ()=>
            root(V('avoir'),
                 mod(Pro('moi').c("nom").pe(3).g("m").n("s")).pos("pre"),
                 mod(Pro('y').pe(3)).pos("pre"),
                 comp(N('arc-en-ciel').g("m").n("s"),
                      det(D('un').g("m").n("s"))),
                 comp(N('ciel').g("m").n("s"),
                      mod(P('dans')).pos("pre"),
                      det(D('le').g("m").n("s")))),
    en : ()=>
            root(V('be'),
                 mod(Pro('there')).pos("pre"),
                 subj(N('rainbow').n("s"),
                      det(D('a'))),
                 comp(N('sky').n("s"),
                      mod(P('in')).pos("pre"),
                      det(D('the')))),
    params:[]
},
{
    id: 15,
    text: "Est mon anniversaire en juin.  | My birthday is in June. ",
    fr : ()=>
            root(V('être'),
                 comp(N('juin').g("m").n("s"),
                      subj(N('anniversaire').g("m").n("s"),
                           det(D('mon').pe(3).pe(1).n("s").ow("s"))),
                      mod(P('en')).pos("pre")).a(".")),
    en : ()=>
            root(V('be'),
                 subj(N('birthday').n("s"),
                      mod(D('my').pe(1).n("s")).pos("pre")),
                 comp(Q('June'),
                      mod(P('in')).pos("pre"))),
    params:[]
},
{
    id: 16,
    text: "Je fatigue aujourd'hui.  | I am tired today. ",
    fr : ()=>
            root(V('fatiguer'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 mod(Adv("aujourd'hui")).pos("post")),
    en : ()=>
            root(V('be'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(A('tired'),
                      comp(N('today').n("s")).pos("post"))),
    params:[]
},
{
    id: 17,
    text: "J'aime dessiner des fleurs.  | I like drawing flowers. ",
    fr : ()=>
            root(V('aimer'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(V('dessiner').t("b"),
                      comp(N('fleur').g("f").n("p"),
                           det(D('un').n("p"))))),
    en : ()=>
            root(V('like'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(V('draw').t("pr"),
                      comp(N('flower').n("p")).pos("post"))),
    params:[]
},
{
    id: 18,
    text: "Mon émission préférée est Peppa Pig.  | My favourite show is Peppa pig. ",
    fr : ()=>
            root(V('être'),
                 subj(N('émission').g("f").n("s"),
                      det(D('mon').pe(3).pe(1).n("s").ow("s")),
                      mod(A('préféré').pos("post").g("f").n("s")).pos("post")),
                 comp(Q('Peppa'),
                      mod(Q('Pig')).pos("post"))),
    en : ()=>
            root(V('be'),
                 subj(N('show').n("s"),
                      mod(D('my').pe(1).n("s")).pos("pre"),
                      mod(A('favourite')).pos("pre")),
                 comp(N('pig').n("s"),
                      mod(Q('Peppa')).pos("pre"))),
    params:[]
},
{
    id: 19,
    text: "Je veux devenir un astronaute quand je suis grand.  | I want to become an astronaut [[when]] I grow up. ",
    fr : ()=>
            root(V('vouloir'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(V('devenir').t("b"),
                      comp(N('astronaute').g("m").n("s"),
                           det(D('un').g("m").n("s"))),
                      mod(V('être').t("p").pe(1).n("s"),
                          mod(C('quand')).pos("pre"),
                          subj(Pro('moi').c("nom").pe(1).n("s")),
                          comp(A('grand').pos("post").g("m").n("s")).pos("post")))),
    en : ()=>
            root(V('want'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(V('become').t("b").t("b-to"),
                      comp(N('astronaut').n("s"),
                           det(D('a'))),
                      mod(V('grow').t("p").pe(1).n("s"),
                          mod(Adv('when')).pos("pre"),
                          subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                          mod(P('up')).pos("post")))),
    params:[]
},
{
    id: 20,
    text: "Je suis heureux quand je suis avec mes amis.  | I am happy [[when]] I am with my friends. ",
    fr : ()=>
            root(V('être'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(A('heureux').pos("post").g("m"),
                      mod(V('être').t("p").pe(1).n("s"),
                          mod(C('quand')).pos("pre"),
                          subj(Pro('moi').c("nom").pe(1).n("s")),
                          comp(N('ami').g("m").n("p"),
                               mod(P('avec')).pos("pre"),
                               det(D('mon').pe(3).pe(1).n("p").ow("s")))))),
    en : ()=>
            root(V('be'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(A('happy'),
                      mod(V('be').t("p").pe(1).n("s"),
                          mod(Adv('when')).pos("pre"),
                          subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                          mod(P('with')).pos("post"),
                          mod(D('my').pe(1).n("s")).pos("post"),
                          comp(N('friend').n("p")).pos("post")))),
    params:[]
},
{
    id: 21,
    text: "Je suis content de vous rencontrer.  | I am pleased to meet you. ",
    fr : ()=>
            root(V('être'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(A('content').pos("post").g("m").n("s"),
                      comp(V('rencontrer').t("b"),
                           mod(P('de')).pos("pre"),
                           comp(Pro('moi').c("nom").pe(2).n("p")).pos("pre")))),
    en : ()=>
            root(V('be'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(A('pleased'),
                      comp(V('meet').t("b").t("b-to"),
                           comp(Pro('you').c("acc").pe(2)).pos("post")))),
    params:[]
},
{
    id: 22,
    text: "J'aime regarder des films d'action.  | I like to watch action movies. ",
    fr : ()=>
            root(V('aimer'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(V('regarder').t("b"),
                      comp(N('film').g("m").n("p"),
                           det(D('un').n("p")),
                           mod(N('action').g("f").n("s"),
                               mod(P('de')).pos("pre"))))),
    en : ()=>
            root(V('like'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(V('watch').t("b").t("b-to"),
                      comp(N('movie').n("p"),
                           mod(N('action').n("s")).pos("pre")))),
    params:[]
},
{
    id: 23,
    text: "Je veux voyager à l'étranger.  | I want to travel abroad. ",
    fr : ()=>
            root(V('vouloir'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(V('voyager').t("b"),
                      comp(N('étranger').g("m").n("s"),
                           mod(P('à')).pos("pre"),
                           det(D('le').n("s"))))),
    en : ()=>
            root(V('want'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(V('travel').t("b").t("b-to"),
                      mod(Adv('abroad')).pos("post"))),
    params:[]
},
{
    id: 24,
    text: "J'ai une grande famille.  | I have a big family. ",
    fr : ()=>
            root(V('avoir'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(N('famille').g("f").n("s"),
                      det(D('un').g("f").n("s")),
                      mod(A('grand').pos("post").g("f").n("s")).pos("pre"))),
    en : ()=>
            root(V('have'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(N('family').n("s"),
                      det(D('a')),
                      mod(A('big')).pos("pre"))),
    params:[]
},
{
    id: 25,
    text: "J'aime lire des livres de science-fiction.  | I like to read books science fiction. ",
    fr : ()=>
            root(V('aimer'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(V('lire').t("b"),
                      comp(N('livre').g("m").n("p"),
                           mod(P('de')).pos("pre"),
                           det(D('le').n("p")),
                           mod(N('science-fiction').g("f").n("s"),
                               mod(P('de')).pos("pre"))))),
    en : ()=>
            root(V('like'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(V('read').t("b").t("b-to"),
                      comp(N('book').n("p"),
                           mod(N('fiction').n("s"),
                               mod(N('science').n("s")).pos("pre"))))),
    params:[]
},
{
    id: 26,
    text: "Je passionne par la musique.  | I am passionate about music. ",
    fr : ()=>
            root(V('passionner'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(N('musique').g("f").n("s"),
                      mod(P('par')).pos("pre"),
                      det(D('le').g("f").n("s")))),
    en : ()=>
            root(V('be'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(A('passionate'),
                      comp(N('music').n("s"),
                           mod(P('about')).pos("pre")))),
    params:[]
},
{
    id: 27,
    text: "J'aime faire du sport en plein air.  | I like to do outdoor sports. ",
    fr : ()=>
            root(V('aimer'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(V('faire').t("b"),
                      comp(N('sport').g("m").n("s"),
                           det(P('de'),
                               mod(D('le').g("m").n("s")).pos("post"))),
                      comp(N('air').g("m").n("s"),
                           mod(P('en')).pos("pre"),
                           mod(A('plein').pos("post").g("m").n("s")).pos("pre")))),
    en : ()=>
            root(V('like'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(V('do').t("b").t("b-to"),
                      comp(N('sport').n("p"),
                           mod(A('outdoor')).pos("pre")))),
    params:[]
},
{
    id: 28,
    text: "Je nais en été.  | I was bear in the summer. ",
    fr : ()=>
            root(V('naître'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(N('été').g("m").n("s"),
                      mod(P('en')).pos("pre"))),
    en : ()=>
            root(V('bear'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 mod(V('be').t("ps").pe(3).n("s")).pos("pre"),
                 comp(N('summer').n("s"),
                      mod(P('in')).pos("pre"),
                      det(D('the')))),
    params:[]
},
{
    id: 29,
    text: "J'ai un frère et une soeur.  | I have a brother and a sister. ",
    fr : ()=>
            root(V('avoir'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 coord(C('et'),
                       comp(N('frère').g("m").n("s"),
                            det(D('un').g("m").n("s"))),
                       comp(N('soeur').g("f").n("s"),
                            det(D('un').g("f").n("s"))))),
    en : ()=>
            root(V('have'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 coord(C('and'),
                       comp(N('brother').n("s"),
                            det(D('a'))),
                       comp(N('sister').n("s"),
                            det(D('a'))))),
    params:[]
},
{
    id: 30,
    text: "Je veux apprendre à cuisiner.  | I want to learn how to cook. ",
    fr : ()=>
            root(V('vouloir'),
                 subj(Pro('moi').c("nom").pe(1).n("s")),
                 comp(V('apprendre').t("b"),
                      comp(V('cuisiner').t("b"),
                           mod(P('à')).pos("pre")))),
    en : ()=>
            root(V('want'),
                 subj(Pro('me').c("nom").pe(1).c("nom").pe(1).n("s")),
                 comp(V('learn').t("b").t("b-to"),
                      comp(Adv('how'),
                           comp(V('cook').t("b").t("b-to")).pos("post")))),
    params:[]
}];