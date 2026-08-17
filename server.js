
'use strict';

const http = require('http');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const QUESTIONS = [{"q": "Quem construiu a arca antes do dilúvio?", "a": ["Abraão", "Noé", "Moisés", "Davi"], "c": 1, "cat": "Antigo Testamento", "d": 1, "ref": "Gênesis 6:13–22", "exp": "Deus ordenou a Noé que construísse a arca para preservar sua família e os animais durante o dilúvio."}, {"q": "Quem derrotou Golias?", "a": ["Saul", "Davi", "Sansão", "Josué"], "c": 1, "cat": "Personagens", "d": 1, "ref": "1 Samuel 17:45–50", "exp": "Davi enfrentou Golias com uma funda e uma pedra, confiando no Senhor."}, {"q": "Quem recebeu os Dez Mandamentos no monte Sinai?", "a": ["Moisés", "Elias", "Josué", "Arão"], "c": 0, "cat": "Antigo Testamento", "d": 1, "ref": "Êxodo 31:18", "exp": "Moisés recebeu de Deus as tábuas do testemunho no monte Sinai."}, {"q": "Em qual cidade Jesus nasceu?", "a": ["Nazaré", "Jerusalém", "Belém", "Cafarnaum"], "c": 2, "cat": "Jesus", "d": 1, "ref": "Mateus 2:1", "exp": "Jesus nasceu em Belém da Judeia, nos dias do rei Herodes."}, {"q": "Quem foi lançado na cova dos leões?", "a": ["Daniel", "José", "Elias", "Isaías"], "c": 0, "cat": "Personagens", "d": 1, "ref": "Daniel 6:16–23", "exp": "Daniel foi lançado na cova por continuar orando a Deus, mas foi preservado."}, {"q": "Quem batizou Jesus?", "a": ["Pedro", "João Batista", "Tiago", "André"], "c": 1, "cat": "Jesus", "d": 1, "ref": "Mateus 3:13–17", "exp": "Jesus foi ao Jordão para ser batizado por João Batista."}, {"q": "Quem traiu Jesus por trinta moedas de prata?", "a": ["Judas Iscariotes", "Tomé", "Mateus", "Filipe"], "c": 0, "cat": "Jesus", "d": 1, "ref": "Mateus 26:14–16", "exp": "Judas Iscariotes combinou entregar Jesus em troca de trinta moedas de prata."}, {"q": "Qual era a profissão de Pedro antes de seguir Jesus?", "a": ["Carpinteiro", "Pescador", "Cobrador de impostos", "Soldado"], "c": 1, "cat": "Personagens", "d": 1, "ref": "Mateus 4:18–20", "exp": "Pedro e André lançavam redes ao mar quando Jesus os chamou."}, {"q": "Quantos dias e noites choveu durante o dilúvio?", "a": ["7", "12", "30", "40"], "c": 3, "cat": "Antigo Testamento", "d": 1, "ref": "Gênesis 7:12", "exp": "A chuva caiu sobre a terra durante quarenta dias e quarenta noites."}, {"q": "Quem foi engolido por um grande peixe?", "a": ["Jonas", "Joel", "Amós", "Ezequiel"], "c": 0, "cat": "Personagens", "d": 1, "ref": "Jonas 1:17", "exp": "O Senhor preparou um grande peixe para engolir Jonas."}, {"q": "Qual é o primeiro livro da Bíblia?", "a": ["Êxodo", "Gênesis", "Salmos", "Mateus"], "c": 1, "cat": "Bíblia", "d": 1, "ref": "Gênesis 1:1", "exp": "Gênesis abre as Escrituras com o relato da criação."}, {"q": "Quem foi a mãe de Jesus?", "a": ["Marta", "Maria", "Isabel", "Ana"], "c": 1, "cat": "Jesus", "d": 1, "ref": "Lucas 1:26–38", "exp": "O anjo Gabriel anunciou a Maria que ela daria à luz Jesus."}, {"q": "Jesus transformou água em quê, nas bodas de Caná?", "a": ["Azeite", "Leite", "Vinho", "Mel"], "c": 2, "cat": "Jesus", "d": 1, "ref": "João 2:1–11", "exp": "Em Caná, Jesus realizou o sinal de transformar água em vinho."}, {"q": "Quem era conhecido por sua grande força física?", "a": ["Sansão", "Salomão", "Samuel", "Neemias"], "c": 0, "cat": "Personagens", "d": 1, "ref": "Juízes 14:5–6", "exp": "Sansão recebeu força extraordinária do Espírito do Senhor."}, {"q": "Qual apóstolo era cobrador de impostos antes de seguir Jesus?", "a": ["João", "Mateus", "Tiago", "Bartolomeu"], "c": 1, "cat": "Personagens", "d": 1, "ref": "Mateus 9:9", "exp": "Mateus estava sentado na coletoria quando Jesus o chamou."}, {"q": "Quem interpretou os sonhos do faraó no Egito?", "a": ["José", "Moisés", "Arão", "Jacó"], "c": 0, "cat": "Antigo Testamento", "d": 1, "ref": "Gênesis 41:14–36", "exp": "José explicou ao faraó que os sonhos anunciavam anos de fartura e de fome."}, {"q": "Qual rei ficou famoso por sua sabedoria?", "a": ["Saul", "Ezequias", "Salomão", "Acabe"], "c": 2, "cat": "Personagens", "d": 1, "ref": "1 Reis 3:9–12", "exp": "Salomão pediu a Deus um coração sábio para governar o povo."}, {"q": "Quantos apóstolos Jesus escolheu?", "a": ["10", "11", "12", "14"], "c": 2, "cat": "Jesus", "d": 1, "ref": "Lucas 6:13", "exp": "Jesus escolheu doze discípulos, aos quais deu o nome de apóstolos."}, {"q": "Quem negou Jesus três vezes?", "a": ["Pedro", "Tomé", "João", "André"], "c": 0, "cat": "Jesus", "d": 1, "ref": "Lucas 22:54–62", "exp": "Pedro negou conhecer Jesus três vezes antes de o galo cantar."}, {"q": "Qual livro contém muitos cânticos e orações?", "a": ["Salmos", "Levítico", "Atos", "Romanos"], "c": 0, "cat": "Bíblia", "d": 1, "ref": "Salmos 1:1–6", "exp": "O livro de Salmos reúne cânticos, louvores, lamentos e orações."}, {"q": "Quem sucedeu Moisés na liderança de Israel?", "a": ["Calebe", "Josué", "Gideão", "Samuel"], "c": 1, "cat": "Antigo Testamento", "d": 2, "ref": "Josué 1:1–2", "exp": "Depois da morte de Moisés, Deus ordenou a Josué que conduzisse o povo."}, {"q": "Qual juiz pediu a Deus um sinal com um velo de lã?", "a": ["Gideão", "Jefté", "Sansão", "Otniel"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "Juízes 6:36–40", "exp": "Gideão pediu sinais envolvendo um velo para confirmar a direção de Deus."}, {"q": "Quem foi vendido por seus irmãos e levado ao Egito?", "a": ["Benjamim", "José", "Rúben", "Judá"], "c": 1, "cat": "Personagens", "d": 2, "ref": "Gênesis 37:28", "exp": "Os irmãos de José o venderam a mercadores que o levaram ao Egito."}, {"q": "Qual profeta desafiou os profetas de Baal no monte Carmelo?", "a": ["Eliseu", "Jeremias", "Elias", "Isaías"], "c": 2, "cat": "Antigo Testamento", "d": 2, "ref": "1 Reis 18:20–39", "exp": "Elias confrontou os profetas de Baal e Deus respondeu com fogo."}, {"q": "Quem era o pai de João Batista?", "a": ["Zacarias", "Simeão", "José", "Nicodemos"], "c": 0, "cat": "Novo Testamento", "d": 2, "ref": "Lucas 1:5–13", "exp": "Zacarias era sacerdote e recebeu do anjo a promessa do nascimento de João."}, {"q": "Em qual rio Naamã mergulhou sete vezes?", "a": ["Jordão", "Nilo", "Eufrates", "Tigre"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "2 Reis 5:10–14", "exp": "Naamã mergulhou sete vezes no Jordão e foi curado."}, {"q": "Quem subiu numa árvore para ver Jesus passar?", "a": ["Bartimeu", "Zaqueu", "Nicodemos", "Jairo"], "c": 1, "cat": "Jesus", "d": 2, "ref": "Lucas 19:1–5", "exp": "Zaqueu subiu em um sicômoro porque era de baixa estatura."}, {"q": "Qual discípulo disse que só acreditaria se visse as marcas de Jesus?", "a": ["Tomé", "Filipe", "André", "Tiago"], "c": 0, "cat": "Jesus", "d": 2, "ref": "João 20:24–29", "exp": "Tomé declarou que queria ver e tocar as marcas antes de crer."}, {"q": "Quem foi a sogra de Rute?", "a": ["Noemi", "Débora", "Ana", "Raquel"], "c": 0, "cat": "Personagens", "d": 2, "ref": "Rute 1:3–5", "exp": "Rute era nora de Noemi e permaneceu com ela após a morte de seus maridos."}, {"q": "Qual cidade teve suas muralhas derrubadas após Israel marchar ao seu redor?", "a": ["Jericó", "Betel", "Hebrom", "Samaria"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "Josué 6:15–20", "exp": "Após sete dias de marcha, o povo gritou e as muralhas de Jericó caíram."}, {"q": "Quem escreveu muitas das cartas do Novo Testamento?", "a": ["Pedro", "Paulo", "Lucas", "Marcos"], "c": 1, "cat": "Bíblia", "d": 2, "ref": "Romanos 1:1", "exp": "Paulo é identificado como autor de várias cartas do Novo Testamento."}, {"q": "Qual evangelista era médico?", "a": ["Mateus", "Marcos", "Lucas", "João"], "c": 2, "cat": "Novo Testamento", "d": 2, "ref": "Colossenses 4:14", "exp": "Paulo chama Lucas de 'o médico amado'."}, {"q": "Quem foi escolhido para substituir Judas Iscariotes entre os Doze?", "a": ["Barnabé", "Silas", "Matias", "Estêvão"], "c": 2, "cat": "Atos", "d": 2, "ref": "Atos 1:23–26", "exp": "Matias foi escolhido para ocupar o lugar deixado por Judas."}, {"q": "Quem foi o primeiro mártir cristão narrado em Atos?", "a": ["Tiago", "Estêvão", "Filipe", "Barnabé"], "c": 1, "cat": "Atos", "d": 2, "ref": "Atos 7:54–60", "exp": "Estêvão foi apedrejado após seu testemunho diante do Sinédrio."}, {"q": "Em qual ilha Paulo naufragou?", "a": ["Creta", "Chipre", "Malta", "Patmos"], "c": 2, "cat": "Atos", "d": 2, "ref": "Atos 28:1", "exp": "Após o naufrágio, os sobreviventes descobriram que a ilha se chamava Malta."}, {"q": "Qual casal mentiu sobre o valor de uma propriedade?", "a": ["Áquila e Priscila", "Ananias e Safira", "Félix e Drusila", "Herodes e Berenice"], "c": 1, "cat": "Atos", "d": 2, "ref": "Atos 5:1–10", "exp": "Ananias e Safira mentiram sobre o valor obtido na venda de uma propriedade."}, {"q": "Quem era a irmã de Marta e Lázaro?", "a": ["Maria", "Joana", "Salomé", "Isabel"], "c": 0, "cat": "Novo Testamento", "d": 2, "ref": "João 11:1–2", "exp": "Maria, Marta e Lázaro eram irmãos e viviam em Betânia."}, {"q": "Qual discípulo cortou a orelha do servo do sumo sacerdote?", "a": ["Pedro", "João", "Judas", "Mateus"], "c": 0, "cat": "Jesus", "d": 2, "ref": "João 18:10", "exp": "Pedro usou uma espada e cortou a orelha direita do servo do sumo sacerdote."}, {"q": "Quem pediu o corpo de Jesus a Pilatos?", "a": ["Nicodemos", "José de Arimateia", "Jairo", "Gamaliel"], "c": 1, "cat": "Jesus", "d": 2, "ref": "Marcos 15:43–46", "exp": "José de Arimateia pediu a Pilatos o corpo de Jesus para sepultá-lo."}, {"q": "Qual profeta teve a visão de um vale de ossos secos?", "a": ["Ezequiel", "Daniel", "Oséias", "Miquéias"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "Ezequiel 37:1–14", "exp": "Ezequiel viu ossos secos recebendo vida como sinal da restauração de Israel."}, {"q": "Qual rei de Judá encontrou o Livro da Lei durante reformas no templo?", "a": ["Josias", "Manassés", "Acaz", "Roboão"], "c": 0, "cat": "Antigo Testamento", "d": 3, "ref": "2 Reis 22:8–11", "exp": "Durante o reinado de Josias, o sacerdote Hilquias encontrou o Livro da Lei."}, {"q": "Quem era o pai do profeta Samuel?", "a": ["Elcana", "Jessé", "Abinadabe", "Hilquias"], "c": 0, "cat": "Personagens", "d": 3, "ref": "1 Samuel 1:1,19–20", "exp": "Samuel era filho de Elcana e Ana."}, {"q": "Qual profeta se casou com Gômer?", "a": ["Oséias", "Amós", "Joel", "Sofonias"], "c": 0, "cat": "Antigo Testamento", "d": 3, "ref": "Oséias 1:2–3", "exp": "Oséias recebeu a ordem de tomar Gômer como esposa."}, {"q": "Quem foi o escriba associado à restauração religiosa após o exílio?", "a": ["Esdras", "Neemias", "Ageu", "Zorobabel"], "c": 0, "cat": "Antigo Testamento", "d": 3, "ref": "Esdras 7:6,10", "exp": "Esdras era escriba versado na Lei e dedicou-se a estudá-la e ensiná-la."}, {"q": "Quem permaneceu em Creta para organizar as igrejas?", "a": ["Tito", "Timóteo", "Silas", "Lucas"], "c": 0, "cat": "Novo Testamento", "d": 3, "ref": "Tito 1:5", "exp": "Paulo deixou Tito em Creta para pôr em ordem o que faltava e constituir presbíteros."}, {"q": "Em qual cidade os discípulos foram chamados cristãos pela primeira vez?", "a": ["Éfeso", "Antioquia", "Corinto", "Roma"], "c": 1, "cat": "Atos", "d": 3, "ref": "Atos 11:26", "exp": "Foi em Antioquia que os discípulos foram chamados cristãos pela primeira vez."}, {"q": "Qual mulher, vendedora de púrpura, recebeu Paulo em Filipos?", "a": ["Lídia", "Dorcas", "Priscila", "Febe"], "c": 0, "cat": "Atos", "d": 3, "ref": "Atos 16:14–15", "exp": "Lídia era comerciante de púrpura e abriu sua casa aos missionários."}, {"q": "Quem aconselhou o Sinédrio a ter cautela com os apóstolos?", "a": ["Gamaliel", "Caifás", "Anás", "Nicodemos"], "c": 0, "cat": "Atos", "d": 3, "ref": "Atos 5:34–39", "exp": "Gamaliel aconselhou prudência, lembrando que uma obra de Deus não poderia ser destruída."}, {"q": "Qual rei viu uma mão escrevendo na parede durante um banquete?", "a": ["Dario", "Belsazar", "Nabucodonosor", "Ciro"], "c": 1, "cat": "Antigo Testamento", "d": 3, "ref": "Daniel 5:1–6", "exp": "Durante o banquete de Belsazar, dedos apareceram escrevendo na parede."}, {"q": "Quem era o pai de Matusalém?", "a": ["Enoque", "Noé", "Jarede", "Lameque"], "c": 0, "cat": "Antigo Testamento", "d": 3, "ref": "Gênesis 5:21–27", "exp": "Matusalém era filho de Enoque."}, {"q": "Qual juiz fez um voto precipitado envolvendo quem saísse de sua casa?", "a": ["Jefté", "Gideão", "Baraque", "Eúde"], "c": 0, "cat": "Antigo Testamento", "d": 3, "ref": "Juízes 11:30–35", "exp": "Jefté fez um voto antes da batalha e sua filha foi a primeira a sair ao seu encontro."}, {"q": "Qual rei consultou uma médium em En-Dor?", "a": ["Saul", "Davi", "Salomão", "Acabe"], "c": 0, "cat": "Antigo Testamento", "d": 3, "ref": "1 Samuel 28:7–11", "exp": "Saul procurou uma médium em En-Dor quando não recebeu resposta do Senhor."}, {"q": "Quem ministrava perante o Senhor ainda menino, sob os cuidados de Eli?", "a": ["Samuel", "Esdras", "Zadoc", "Abiatar"], "c": 0, "cat": "Personagens", "d": 3, "ref": "1 Samuel 2:18", "exp": "Samuel servia diante do Senhor ainda menino, usando um éfode de linho."}, {"q": "Quem foi o pai de Bezalel, artesão do tabernáculo?", "a": ["Uri", "Hur", "Arão", "Eleazar"], "c": 0, "cat": "Antigo Testamento", "d": 3, "ref": "Êxodo 31:2", "exp": "Bezalel era filho de Uri, filho de Hur, da tribo de Judá."}, {"q": "Qual mulher foi ressuscitada por Pedro em Jope?", "a": ["Dorcas (Tabita)", "Lídia", "Priscila", "Marta"], "c": 0, "cat": "Atos", "d": 3, "ref": "Atos 9:36–41", "exp": "Pedro orou por Tabita, também chamada Dorcas, e ela voltou à vida."}, {"q": "Quem explicou as Escrituras ao eunuco etíope?", "a": ["Filipe", "Pedro", "Paulo", "Barnabé"], "c": 0, "cat": "Atos", "d": 3, "ref": "Atos 8:26–35", "exp": "Filipe se aproximou da carruagem e explicou a passagem de Isaías ao eunuco."}, {"q": "Qual era o nome do servo do sumo sacerdote cuja orelha foi cortada?", "a": ["Malco", "Bartimeu", "Lázaro", "Jairo"], "c": 0, "cat": "Jesus", "d": 3, "ref": "João 18:10", "exp": "João identifica o servo do sumo sacerdote como Malco."}, {"q": "Em qual carta aparece a armadura de Deus?", "a": ["Efésios", "Gálatas", "Colossenses", "Filipenses"], "c": 0, "cat": "Bíblia", "d": 3, "ref": "Efésios 6:10–18", "exp": "Paulo usa a imagem da armadura de Deus ao falar da batalha espiritual."}, {"q": "Qual livro foi endereçado a Teófilo, assim como o Evangelho de Lucas?", "a": ["Atos dos Apóstolos", "Romanos", "Hebreus", "Apocalipse"], "c": 0, "cat": "Bíblia", "d": 3, "ref": "Atos 1:1", "exp": "Atos começa mencionando o primeiro tratado dirigido a Teófilo."}, {"q": "Qual profeta viu o Senhor assentado em um alto e sublime trono?", "a": ["Isaías", "Jeremias", "Ezequiel", "Daniel"], "c": 0, "cat": "Antigo Testamento", "d": 3, "ref": "Isaías 6:1", "exp": "Isaías descreve a visão do Senhor em um alto e sublime trono."}, {"q": "Quem sonhou com uma escada que alcançava o céu?", "a": ["Jacó", "Isaque", "José", "Abraão"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "Gênesis 28:10–17", "exp": "Jacó sonhou com uma escada entre a terra e o céu, com anjos subindo e descendo."}, {"q": "Qual discípulo era irmão de Pedro?", "a": ["André", "Filipe", "Mateus", "Tomé"], "c": 0, "cat": "Novo Testamento", "d": 1, "ref": "Mateus 4:18", "exp": "André era irmão de Simão Pedro."}, {"q": "Quem ungiu Davi como rei?", "a": ["Samuel", "Natã", "Gade", "Eli"], "c": 0, "cat": "Personagens", "d": 2, "ref": "1 Samuel 16:12–13", "exp": "Samuel ungiu Davi, e o Espírito do Senhor se apoderou dele."}, {"q": "Quem ajudou Jesus a carregar a cruz?", "a": ["Simão de Cirene", "José de Arimateia", "Nicodemos", "Bartimeu"], "c": 0, "cat": "Jesus", "d": 2, "ref": "Lucas 23:26", "exp": "Simão, natural de Cirene, foi constrangido a carregar a cruz atrás de Jesus."}, {"q": "Quem escreveu no chão durante o episódio da mulher acusada de adultério?", "a": ["Jesus", "Pedro", "João", "Nicodemos"], "c": 0, "cat": "Jesus", "d": 2, "ref": "João 8:6–8", "exp": "Jesus se inclinou e escreveu no chão com o dedo."}, {"q": "Quem recebeu uma visão em Patmos?", "a": ["João", "Pedro", "Paulo", "Tiago"], "c": 0, "cat": "Novo Testamento", "d": 2, "ref": "Apocalipse 1:9–11", "exp": "João estava na ilha de Patmos quando recebeu as visões registradas no Apocalipse."}, {"q": "Quem foi a mãe do profeta Samuel?", "a": ["Ana", "Mical", "Abigail", "Noemi"], "c": 0, "cat": "Personagens", "d": 1, "ref": "1 Samuel 1:19–20", "exp": "Ana orou por um filho e chamou-o Samuel."}, {"q": "Qual rei mandou lançar Sadraque, Mesaque e Abede-Nego na fornalha?", "a": ["Nabucodonosor", "Dario", "Ciro", "Belsazar"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "Daniel 3:19–23", "exp": "Nabucodonosor ordenou que os três fossem lançados na fornalha ardente."}, {"q": "Quem disse: 'Eis-me aqui, envia-me a mim'?", "a": ["Isaías", "Jeremias", "Ezequiel", "Samuel"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "Isaías 6:8", "exp": "Isaías respondeu ao chamado de Deus dizendo que estava disposto a ser enviado."}, {"q": "Quem era o irmão de Moisés?", "a": ["Arão", "Calebe", "Josué", "Jetro"], "c": 0, "cat": "Personagens", "d": 1, "ref": "Êxodo 4:14", "exp": "Arão, irmão de Moisés, foi designado para ajudá-lo a falar ao povo."}, {"q": "Qual discípulo Jesus chamou de 'a pedra' em referência ao seu nome?", "a": ["Pedro", "João", "Tiago", "André"], "c": 0, "cat": "Jesus", "d": 2, "ref": "Mateus 16:18", "exp": "Jesus relacionou o nome de Pedro à imagem da pedra."}, {"q": "Quem hospedou os espias israelitas em Jericó?", "a": ["Raabe", "Débora", "Rute", "Miriã"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "Josué 2:1–6", "exp": "Raabe recebeu os espias e os escondeu dos homens do rei."}, {"q": "Quem disse: 'Eu e a minha casa serviremos ao Senhor'?", "a": ["Josué", "Moisés", "Samuel", "Davi"], "c": 0, "cat": "Antigo Testamento", "d": 1, "ref": "Josué 24:15", "exp": "Josué declarou publicamente a decisão de sua casa de servir ao Senhor."}, {"q": "Quem era o pai de Davi?", "a": ["Jessé", "Saul", "Samuel", "Obede"], "c": 0, "cat": "Personagens", "d": 1, "ref": "1 Samuel 16:1", "exp": "Davi era filho de Jessé, de Belém."}, {"q": "Quem foi a esposa de Abraão?", "a": ["Sara", "Rebeca", "Raquel", "Lia"], "c": 0, "cat": "Personagens", "d": 1, "ref": "Gênesis 17:15", "exp": "Sara foi esposa de Abraão e mãe de Isaque."}, {"q": "Qual discípulo era conhecido como o 'discípulo amado'?", "a": ["João", "Pedro", "Tomé", "André"], "c": 0, "cat": "Jesus", "d": 2, "ref": "João 13:23", "exp": "O Evangelho de João se refere a um discípulo amado por Jesus, tradicionalmente identificado com João."}, {"q": "Quem era o irmão de Marta e Maria?", "a": ["Lázaro", "Jairo", "Nicodemos", "Zaqueu"], "c": 0, "cat": "Jesus", "d": 1, "ref": "João 11:1–3", "exp": "Lázaro era irmão de Marta e Maria, de Betânia."}, {"q": "Qual profeta foi levado ao céu num redemoinho?", "a": ["Elias", "Eliseu", "Isaías", "Jeremias"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "2 Reis 2:11", "exp": "Elias foi levado ao céu num redemoinho, diante de Eliseu."}, {"q": "Quem teve a túnica de muitas cores?", "a": ["José", "Benjamim", "Davi", "Samuel"], "c": 0, "cat": "Personagens", "d": 1, "ref": "Gênesis 37:3", "exp": "Jacó deu a José uma túnica especial, símbolo de seu amor por ele."}, {"q": "Quem escreveu a maior parte dos Salmos?", "a": ["Davi", "Salomão", "Moisés", "Asafe"], "c": 0, "cat": "Bíblia", "d": 2, "ref": "Salmos 3; 18; 51", "exp": "Muitos Salmos são atribuídos a Davi, embora o livro também reúna composições de outros autores."}, {"q": "Quem foi a primeira mulher mencionada na Bíblia?", "a": ["Eva", "Sara", "Rebeca", "Lia"], "c": 0, "cat": "Bíblia", "d": 1, "ref": "Gênesis 2:22–23", "exp": "Eva foi formada a partir de Adão e é a primeira mulher mencionada nas Escrituras."}, {"q": "Quem era o sogro de Moisés?", "a": ["Jetro", "Calebe", "Arão", "Eleazar"], "c": 0, "cat": "Personagens", "d": 2, "ref": "Êxodo 3:1", "exp": "Jetro era sacerdote de Midiã e sogro de Moisés."}, {"q": "Qual livro vem depois de Gênesis?", "a": ["Êxodo", "Levítico", "Números", "Deuteronômio"], "c": 0, "cat": "Bíblia", "d": 1, "ref": "Êxodo 1:1", "exp": "Êxodo é o segundo livro da Bíblia e continua a história iniciada em Gênesis."}, {"q": "Qual era o nome hebraico de Ester?", "a": ["Hadassa", "Miriã", "Abigail", "Débora"], "c": 0, "cat": "Personagens", "d": 3, "ref": "Ester 2:7", "exp": "Ester também era chamada Hadassa."}, {"q": "Quem construiu o primeiro templo em Jerusalém?", "a": ["Salomão", "Davi", "Saul", "Ezequias"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "1 Reis 6:1", "exp": "Salomão construiu o templo em Jerusalém durante seu reinado."}, {"q": "Quem confrontou o rei Davi após o pecado com Bate-Seba?", "a": ["Natã", "Samuel", "Gade", "Elias"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "2 Samuel 12:1–7", "exp": "O profeta Natã confrontou Davi por meio de uma parábola."}, {"q": "Qual profeta foi alimentado por corvos?", "a": ["Elias", "Eliseu", "Jeremias", "Oséias"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "1 Reis 17:4–6", "exp": "Durante a seca, corvos levaram alimento a Elias."}, {"q": "Quem foi a mãe de João Batista?", "a": ["Isabel", "Maria", "Ana", "Marta"], "c": 0, "cat": "Novo Testamento", "d": 1, "ref": "Lucas 1:13", "exp": "Isabel, esposa de Zacarias, foi mãe de João Batista."}, {"q": "Qual evangelho começa com 'No princípio era o Verbo'?", "a": ["João", "Mateus", "Marcos", "Lucas"], "c": 0, "cat": "Bíblia", "d": 2, "ref": "João 1:1", "exp": "O Evangelho de João inicia apresentando o Verbo que estava com Deus e era Deus."}, {"q": "Quem escreveu o livro de Atos?", "a": ["Lucas", "Paulo", "Pedro", "João"], "c": 0, "cat": "Bíblia", "d": 2, "ref": "Atos 1:1; Lucas 1:1–4", "exp": "Atos é a continuação do relato dirigido a Teófilo pelo mesmo autor do Evangelho de Lucas."}, {"q": "Quem era a irmã de Moisés?", "a": ["Miriã", "Débora", "Raquel", "Ana"], "c": 0, "cat": "Personagens", "d": 1, "ref": "Êxodo 15:20", "exp": "Miriã, irmã de Arão e Moisés, é chamada de profetisa."}, {"q": "Qual rei pediu sabedoria a Deus?", "a": ["Salomão", "Davi", "Ezequias", "Josias"], "c": 0, "cat": "Personagens", "d": 1, "ref": "1 Reis 3:5–12", "exp": "Salomão pediu entendimento para governar bem o povo."}, {"q": "Quem disse 'Fala, porque o teu servo ouve'?", "a": ["Samuel", "Eli", "Davi", "Jeremias"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "1 Samuel 3:9–10", "exp": "Samuel respondeu assim ao chamado de Deus, conforme orientação de Eli."}, {"q": "Quem viu uma sarça ardente que não se consumia?", "a": ["Moisés", "Abraão", "Elias", "Josué"], "c": 0, "cat": "Antigo Testamento", "d": 1, "ref": "Êxodo 3:2–4", "exp": "Moisés viu a sarça ardendo sem se consumir e ouviu o chamado de Deus."}, {"q": "Quem foi a rainha que visitou Salomão para provar sua sabedoria?", "a": ["Rainha de Sabá", "Ester", "Jezabel", "Atalia"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "1 Reis 10:1–9", "exp": "A rainha de Sabá veio testar Salomão com perguntas difíceis."}, {"q": "Qual era a cidade natal de Paulo?", "a": ["Tarso", "Jerusalém", "Antioquia", "Roma"], "c": 0, "cat": "Atos", "d": 2, "ref": "Atos 21:39", "exp": "Paulo afirmou ser judeu de Tarso, cidade da Cilícia."}, {"q": "Quem libertou Pedro da prisão em Atos 12?", "a": ["Um anjo do Senhor", "Paulo", "Barnabé", "Herodes"], "c": 0, "cat": "Atos", "d": 2, "ref": "Atos 12:7–10", "exp": "Um anjo do Senhor apareceu e conduziu Pedro para fora da prisão."}, {"q": "Qual casal ensinou Apolo com mais exatidão?", "a": ["Áquila e Priscila", "Ananias e Safira", "Zacarias e Isabel", "Félix e Drusila"], "c": 0, "cat": "Atos", "d": 3, "ref": "Atos 18:24–26", "exp": "Áquila e Priscila explicaram a Apolo com mais precisão o caminho de Deus."}, {"q": "Quem era o jovem que caiu da janela enquanto Paulo falava?", "a": ["Êutico", "Trófimo", "Tíquico", "Onésimo"], "c": 0, "cat": "Atos", "d": 3, "ref": "Atos 20:9–12", "exp": "Êutico adormeceu, caiu do terceiro andar e foi socorrido por Paulo."}, {"q": "Qual rei ordenou que Daniel fosse lançado na cova dos leões?", "a": ["Dario", "Ciro", "Nabucodonosor", "Belsazar"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "Daniel 6:16", "exp": "O rei Dario, preso ao decreto que assinara, ordenou que Daniel fosse lançado na cova."}, {"q": "Qual mulher julgava Israel debaixo de uma palmeira?", "a": ["Débora", "Jael", "Rute", "Miriã"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "Juízes 4:4–5", "exp": "Débora, profetisa e juíza, julgava Israel debaixo de uma palmeira."}, {"q": "Quem matou Sísera com uma estaca?", "a": ["Jael", "Débora", "Miriã", "Raabe"], "c": 0, "cat": "Antigo Testamento", "d": 3, "ref": "Juízes 4:21", "exp": "Jael matou Sísera usando uma estaca da tenda."}, {"q": "Qual profeta pediu uma porção dobrada do espírito de Elias?", "a": ["Eliseu", "Isaías", "Jeremias", "Samuel"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "2 Reis 2:9", "exp": "Eliseu pediu a Elias uma porção dobrada de seu espírito."}, {"q": "Quem era o pai de João e Tiago?", "a": ["Zebedeu", "Jonas", "Alfeu", "Cleopas"], "c": 0, "cat": "Novo Testamento", "d": 2, "ref": "Mateus 4:21", "exp": "Tiago e João eram filhos de Zebedeu."}, {"q": "Quem foi o discípulo que apresentou Natanael a Jesus?", "a": ["Filipe", "André", "Pedro", "Mateus"], "c": 0, "cat": "Jesus", "d": 3, "ref": "João 1:43–46", "exp": "Filipe encontrou Natanael e lhe falou sobre Jesus de Nazaré."}, {"q": "Qual mulher ungiu os pés de Jesus e os enxugou com os cabelos?", "a": ["Maria de Betânia", "Marta", "Maria Madalena", "Joana"], "c": 0, "cat": "Jesus", "d": 2, "ref": "João 12:1–3", "exp": "Maria, irmã de Lázaro, ungiu os pés de Jesus com perfume."}, {"q": "Quem era o governador romano que julgou Jesus?", "a": ["Pôncio Pilatos", "Félix", "Festo", "Quirino"], "c": 0, "cat": "Jesus", "d": 1, "ref": "Mateus 27:2,11–26", "exp": "Jesus foi levado diante de Pôncio Pilatos, governador romano."}, {"q": "Quem foi o sumo sacerdote durante parte do julgamento de Jesus?", "a": ["Caifás", "Zacarias", "Anás filho", "Gamaliel"], "c": 0, "cat": "Jesus", "d": 2, "ref": "Mateus 26:57", "exp": "Jesus foi levado à casa de Caifás, o sumo sacerdote."}, {"q": "Quem pediu a cabeça de João Batista?", "a": ["A filha de Herodias", "Marta", "Jezabel", "Berenice"], "c": 0, "cat": "Novo Testamento", "d": 2, "ref": "Mateus 14:6–11", "exp": "Após dançar diante de Herodes, a filha de Herodias pediu a cabeça de João Batista."}, {"q": "Quem escreveu a carta a Filemom?", "a": ["Paulo", "Pedro", "João", "Tiago"], "c": 0, "cat": "Bíblia", "d": 2, "ref": "Filemom 1:1", "exp": "A carta se apresenta como escrita por Paulo, prisioneiro de Cristo Jesus."}, {"q": "Qual carta contém o capítulo conhecido como 'o capítulo do amor'?", "a": ["1 Coríntios", "Romanos", "Efésios", "Hebreus"], "c": 0, "cat": "Bíblia", "d": 2, "ref": "1 Coríntios 13", "exp": "1 Coríntios 13 é conhecido por sua descrição do amor."}, {"q": "Qual livro do Novo Testamento fala da 'galeria dos heróis da fé'?", "a": ["Hebreus", "Tiago", "Romanos", "Atos"], "c": 0, "cat": "Bíblia", "d": 2, "ref": "Hebreus 11", "exp": "Hebreus 11 apresenta exemplos de fé ao longo da história bíblica."}, {"q": "Quem disse 'O Senhor deu, o Senhor tomou; bendito seja o nome do Senhor'?", "a": ["Jó", "Davi", "Salomão", "Elias"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "Jó 1:21", "exp": "Jó pronunciou essas palavras após sofrer grandes perdas."}, {"q": "Quem foi o primeiro homem criado por Deus?", "a": ["Adão", "Noé", "Abraão", "Moisés"], "c": 0, "cat": "Bíblia", "d": 1, "ref": "Gênesis 2:7", "exp": "Deus formou Adão do pó da terra e lhe deu o fôlego de vida."}, {"q": "Quem foi o primeiro filho de Adão e Eva mencionado pelo nome?", "a": ["Caim", "Abel", "Sete", "Enoque"], "c": 0, "cat": "Antigo Testamento", "d": 1, "ref": "Gênesis 4:1", "exp": "Eva deu à luz Caim e reconheceu a dádiva de Deus."}, {"q": "Quem matou Abel?", "a": ["Caim", "Sete", "Noé", "Lameque"], "c": 0, "cat": "Antigo Testamento", "d": 1, "ref": "Gênesis 4:8", "exp": "Caim se levantou contra Abel, seu irmão, e o matou."}, {"q": "Quem era o pai de Isaque?", "a": ["Abraão", "Jacó", "José", "Ló"], "c": 0, "cat": "Personagens", "d": 1, "ref": "Gênesis 21:3", "exp": "Abraão deu ao filho que Sara lhe dera o nome de Isaque."}, {"q": "Quem era a esposa de Isaque?", "a": ["Rebeca", "Raquel", "Lia", "Sara"], "c": 0, "cat": "Personagens", "d": 1, "ref": "Gênesis 24:67", "exp": "Isaque tomou Rebeca por esposa."}, {"q": "Quem recebeu o nome Israel?", "a": ["Jacó", "José", "Isaque", "Abraão"], "c": 0, "cat": "Personagens", "d": 1, "ref": "Gênesis 32:28", "exp": "Após lutar com o homem, Jacó recebeu o nome Israel."}, {"q": "Quantos filhos Jacó teve?", "a": ["12", "10", "7", "14"], "c": 0, "cat": "Antigo Testamento", "d": 1, "ref": "Gênesis 35:22–26", "exp": "Jacó teve doze filhos, ancestrais das tribos de Israel."}, {"q": "Quem encontrou Moisés bebê no rio?", "a": ["A filha de Faraó", "Miriã", "A mãe de Moisés", "Uma serva hebreia"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "Êxodo 2:5–10", "exp": "A filha de Faraó encontrou o cesto com Moisés entre os juncos."}, {"q": "Qual mar se abriu diante dos israelitas?", "a": ["Mar Vermelho", "Mar Morto", "Mar da Galileia", "Mediterrâneo"], "c": 0, "cat": "Antigo Testamento", "d": 1, "ref": "Êxodo 14:21–22", "exp": "As águas do mar se dividiram e Israel atravessou em terra seca."}, {"q": "Qual alimento caiu do céu para sustentar Israel no deserto?", "a": ["Maná", "Codornas apenas", "Pão de cevada", "Tâmaras"], "c": 0, "cat": "Antigo Testamento", "d": 1, "ref": "Êxodo 16:14–15", "exp": "O povo chamou de maná o alimento que Deus providenciou."}, {"q": "Quem fez um bezerro de ouro enquanto Moisés estava no monte?", "a": ["Arão", "Josué", "Calebe", "Miriã"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "Êxodo 32:1–4", "exp": "Arão moldou o ouro e fez um bezerro para o povo."}, {"q": "Quem foi uma das duas testemunhas fiéis entre os espias enviados a Canaã?", "a": ["Calebe", "Corá", "Balaão", "Abirão"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "Números 14:6–9", "exp": "Calebe e Josué confiaram que Deus poderia entregar Canaã a Israel."}, {"q": "Quem viu uma jumenta falar?", "a": ["Balaão", "Balaque", "Josué", "Moisés"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "Números 22:28–30", "exp": "Deus abriu a boca da jumenta de Balaão para repreendê-lo."}, {"q": "Quem liderou Israel na conquista de Canaã após Moisés?", "a": ["Josué", "Calebe", "Gideão", "Samuel"], "c": 0, "cat": "Antigo Testamento", "d": 1, "ref": "Josué 1:1–6", "exp": "Josué recebeu de Deus a missão de conduzir o povo à terra prometida."}, {"q": "Quem escondeu os espias em Jericó?", "a": ["Raabe", "Rute", "Débora", "Jael"], "c": 0, "cat": "Antigo Testamento", "d": 1, "ref": "Josué 2:1–6", "exp": "Raabe escondeu os espias no terraço de sua casa."}, {"q": "Quem era o marido de Rute?", "a": ["Boaz", "Obede", "Elimeleque", "Quiliom"], "c": 0, "cat": "Personagens", "d": 2, "ref": "Rute 4:13", "exp": "Boaz tomou Rute por esposa."}, {"q": "Qual filho de Rute e Boaz foi avô de Davi?", "a": ["Obede", "Jessé", "Salomão", "Samuel"], "c": 0, "cat": "Personagens", "d": 3, "ref": "Rute 4:17", "exp": "Obede foi pai de Jessé, e Jessé foi pai de Davi."}, {"q": "Quem foi o primeiro rei de Israel?", "a": ["Saul", "Davi", "Salomão", "Samuel"], "c": 0, "cat": "Antigo Testamento", "d": 1, "ref": "1 Samuel 10:1,24", "exp": "Saul foi ungido por Samuel e apresentado ao povo como rei."}, {"q": "Quem era o melhor amigo de Davi, filho de Saul?", "a": ["Jônatas", "Abner", "Joabe", "Natã"], "c": 0, "cat": "Personagens", "d": 1, "ref": "1 Samuel 18:1–4", "exp": "Jônatas fez aliança com Davi e o amou como à própria alma."}, {"q": "Quem poupou a vida de Saul numa caverna?", "a": ["Davi", "Samuel", "Jônatas", "Abner"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "1 Samuel 24:3–7", "exp": "Davi cortou a ponta do manto de Saul, mas recusou-se a matá-lo."}, {"q": "Qual filho de Davi se rebelou contra ele?", "a": ["Absalão", "Salomão", "Amnom", "Adonias"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "2 Samuel 15:10–14", "exp": "Absalão organizou uma conspiração e tentou tomar o reino."}, {"q": "Quem sucedeu Davi como rei?", "a": ["Salomão", "Absalão", "Saul", "Roboão"], "c": 0, "cat": "Antigo Testamento", "d": 1, "ref": "1 Reis 2:12", "exp": "Salomão assentou-se no trono de Davi, seu pai."}, {"q": "Quem dividiu o reino após Salomão?", "a": ["Roboão e Jeroboão", "Saul e Davi", "Elias e Eliseu", "Ezequias e Josias"], "c": 0, "cat": "Antigo Testamento", "d": 3, "ref": "1 Reis 12:16–20", "exp": "Após a crise no reinado de Roboão, Jeroboão tornou-se rei sobre as tribos do norte."}, {"q": "Quem foi ressuscitado por Elias, filho de uma viúva?", "a": ["O filho da viúva de Sarepta", "Lázaro", "O filho da sunamita", "Êutico"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "1 Reis 17:17–24", "exp": "Elias orou e Deus devolveu a vida ao filho da viúva."}, {"q": "Quem sucedeu Elias como profeta?", "a": ["Eliseu", "Isaías", "Jeremias", "Amós"], "c": 0, "cat": "Antigo Testamento", "d": 1, "ref": "2 Reis 2:13–15", "exp": "Eliseu tomou o manto de Elias e continuou seu ministério profético."}, {"q": "Qual rei recebeu mais quinze anos de vida após orar?", "a": ["Ezequias", "Josias", "Acaz", "Manassés"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "2 Reis 20:1–6", "exp": "Deus ouviu a oração de Ezequias e acrescentou quinze anos à sua vida."}, {"q": "Qual rei promoveu uma grande reforma e celebrou a Páscoa após encontrar o Livro da Lei?", "a": ["Josias", "Acabe", "Jeoaquim", "Uzias"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "2 Reis 23:21–23", "exp": "Josias renovou a aliança e ordenou a celebração da Páscoa."}, {"q": "Qual personagem bíblico reconstruiu os muros de Jerusalém?", "a": ["Neemias", "Esdras", "Zorobabel", "Daniel"], "c": 0, "cat": "Antigo Testamento", "d": 1, "ref": "Neemias 2:17–18", "exp": "Neemias liderou o povo na reconstrução dos muros de Jerusalém."}, {"q": "Quem tentou impedir Neemias com intimidações e zombarias?", "a": ["Sambalate e Tobias", "Hamã e Mardoqueu", "Dario e Ciro", "Acabe e Jezabel"], "c": 0, "cat": "Antigo Testamento", "d": 3, "ref": "Neemias 4:1–8", "exp": "Sambalate e Tobias se opuseram à reconstrução."}, {"q": "Quem criou Ester como filha?", "a": ["Mardoqueu", "Hamã", "Assuero", "Esdras"], "c": 0, "cat": "Personagens", "d": 2, "ref": "Ester 2:7", "exp": "Mardoqueu criou Ester, sua prima, como filha."}, {"q": "Quem planejou destruir os judeus no livro de Ester?", "a": ["Hamã", "Mardoqueu", "Assuero", "Zeres"], "c": 0, "cat": "Antigo Testamento", "d": 1, "ref": "Ester 3:5–6", "exp": "Hamã decidiu exterminar o povo de Mardoqueu."}, {"q": "Quem disse 'Ainda que ele me mate, nele esperarei'?", "a": ["Jó", "Davi", "Jeremias", "Habacuque"], "c": 0, "cat": "Antigo Testamento", "d": 3, "ref": "Jó 13:15", "exp": "Jó expressou sua confiança em Deus mesmo em meio ao sofrimento."}, {"q": "Qual salmo começa com 'O Senhor é o meu pastor'?", "a": ["Salmo 23", "Salmo 91", "Salmo 1", "Salmo 119"], "c": 0, "cat": "Bíblia", "d": 1, "ref": "Salmos 23:1", "exp": "O Salmo 23 apresenta Deus como pastor que cuida de seu povo."}, {"q": "Qual é o maior capítulo da Bíblia em número de versículos?", "a": ["Salmo 119", "Salmo 23", "Isaías 53", "João 17"], "c": 0, "cat": "Bíblia", "d": 2, "ref": "Salmo 119", "exp": "O Salmo 119 possui 176 versículos e celebra a Palavra de Deus."}, {"q": "Qual livro apresenta a frase 'Tudo tem o seu tempo determinado'?", "a": ["Eclesiastes", "Provérbios", "Jó", "Salmos"], "c": 0, "cat": "Bíblia", "d": 1, "ref": "Eclesiastes 3:1", "exp": "Eclesiastes 3 reflete sobre os diferentes tempos da vida."}, {"q": "Quem é tradicionalmente associado a muitos provérbios bíblicos?", "a": ["Salomão", "Davi", "Moisés", "Samuel"], "c": 0, "cat": "Bíblia", "d": 1, "ref": "Provérbios 1:1", "exp": "O livro de Provérbios começa atribuindo provérbios a Salomão."}, {"q": "Qual profeta é conhecido como 'profeta chorão' pela tradição?", "a": ["Jeremias", "Isaías", "Ezequiel", "Amós"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "Jeremias 9:1", "exp": "Jeremias expressa profunda tristeza pelo estado espiritual do povo."}, {"q": "Qual profeta foi chamado ainda no ventre materno?", "a": ["Jeremias", "Elias", "Jonas", "Amós"], "c": 0, "cat": "Antigo Testamento", "d": 2, "ref": "Jeremias 1:5", "exp": "Deus declarou ter conhecido e separado Jeremias antes de seu nascimento."}, {"q": "Quem teve visões de quatro animais e de um Ancião de Dias?", "a": ["Daniel", "Ezequiel", "Zacarias", "Isaías"], "c": 0, "cat": "Antigo Testamento", "d": 3, "ref": "Daniel 7:1–14", "exp": "Daniel viu quatro animais e depois o Ancião de Dias em visão."}, {"q": "Qual profeta foi chamado para pregar a Nínive?", "a": ["Jonas", "Naum", "Habacuque", "Miquéias"], "c": 0, "cat": "Antigo Testamento", "d": 1, "ref": "Jonas 1:1–2", "exp": "Jonas foi enviado por Deus à grande cidade de Nínive."}, {"q": "Qual profeta anunciou que o justo viveria pela fé?", "a": ["Habacuque", "Ageu", "Malaquias", "Joel"], "c": 0, "cat": "Antigo Testamento", "d": 3, "ref": "Habacuque 2:4", "exp": "Habacuque declara que o justo viverá por sua fé."}, {"q": "Qual livro encerra o Antigo Testamento na ordem cristã tradicional?", "a": ["Malaquias", "Zacarias", "Ageu", "Neemias"], "c": 0, "cat": "Bíblia", "d": 1, "ref": "Malaquias 4", "exp": "Na ordem cristã tradicional, Malaquias é o último livro do Antigo Testamento."}, {"q": "Quem anunciou a Maria o nascimento de Jesus?", "a": ["Gabriel", "Miguel", "Rafael", "Um querubim"], "c": 0, "cat": "Jesus", "d": 1, "ref": "Lucas 1:26–31", "exp": "O anjo Gabriel foi enviado por Deus a Maria."}, {"q": "Quem era o marido de Maria, mãe de Jesus?", "a": ["José", "Zacarias", "Joaquim", "Simeão"], "c": 0, "cat": "Jesus", "d": 1, "ref": "Mateus 1:18–20", "exp": "José era prometido em casamento a Maria."}, {"q": "Quem reconheceu o menino Jesus no templo e disse que podia partir em paz?", "a": ["Simeão", "Zacarias", "Nicodemos", "Gamaliel"], "c": 0, "cat": "Jesus", "d": 2, "ref": "Lucas 2:25–32", "exp": "Simeão tomou Jesus nos braços e louvou a Deus."}, {"q": "Qual profetisa idosa falou sobre Jesus no templo?", "a": ["Ana", "Isabel", "Marta", "Joana"], "c": 0, "cat": "Jesus", "d": 2, "ref": "Lucas 2:36–38", "exp": "Ana, profetisa, falava sobre o menino a todos os que esperavam a redenção."}, {"q": "Em que cidade Jesus cresceu?", "a": ["Nazaré", "Belém", "Jerusalém", "Betânia"], "c": 0, "cat": "Jesus", "d": 1, "ref": "Lucas 2:39–40", "exp": "Após retornarem da apresentação no templo, a família voltou para Nazaré."}, {"q": "Quantos dias Jesus jejuou no deserto?", "a": ["40", "30", "7", "12"], "c": 0, "cat": "Jesus", "d": 1, "ref": "Mateus 4:2", "exp": "Jesus jejuou quarenta dias e quarenta noites."}, {"q": "Qual foi a primeira tentação descrita em Mateus 4?", "a": ["Transformar pedras em pães", "Pular do templo", "Adorar Satanás", "Chamar legiões de anjos"], "c": 0, "cat": "Jesus", "d": 2, "ref": "Mateus 4:3", "exp": "O tentador sugeriu que Jesus transformasse pedras em pães."}, {"q": "Quem era o irmão de João, filho de Zebedeu?", "a": ["Tiago", "Pedro", "André", "Filipe"], "c": 0, "cat": "Jesus", "d": 1, "ref": "Mateus 4:21", "exp": "Tiago e João eram irmãos e filhos de Zebedeu."}, {"q": "Qual discípulo trouxe um menino com cinco pães e dois peixes à atenção de Jesus?", "a": ["André", "Pedro", "Filipe", "Tomé"], "c": 0, "cat": "Jesus", "d": 3, "ref": "João 6:8–9", "exp": "André mencionou o menino que tinha cinco pães de cevada e dois peixes."}, {"q": "Quem pediu a Jesus que curasse seu servo e demonstrou grande fé?", "a": ["Um centurião", "Jairo", "Nicodemos", "Zaqueu"], "c": 0, "cat": "Jesus", "d": 2, "ref": "Mateus 8:5–13", "exp": "Um centurião pediu a cura de seu servo e confiou na autoridade de Jesus."}, {"q": "Quem teve a filha ressuscitada por Jesus?", "a": ["Jairo", "Zaqueu", "Nicodemos", "Bartimeu"], "c": 0, "cat": "Jesus", "d": 2, "ref": "Marcos 5:22–43", "exp": "Jairo pediu socorro por sua filha, e Jesus a ressuscitou."}, {"q": "Quem tocou nas vestes de Jesus e foi curada de uma hemorragia?", "a": ["Uma mulher enferma havia doze anos", "Marta", "Maria Madalena", "Joana"], "c": 0, "cat": "Jesus", "d": 2, "ref": "Marcos 5:25–34", "exp": "Uma mulher que sofria havia doze anos tocou na roupa de Jesus e foi curada."}, {"q": "Quem Jesus chamou para fora do túmulo em Betânia?", "a": ["Lázaro", "Jairo", "Estêvão", "João Batista"], "c": 0, "cat": "Jesus", "d": 1, "ref": "João 11:43–44", "exp": "Jesus clamou: 'Lázaro, vem para fora'."}, {"q": "Qual discípulo andou sobre as águas em direção a Jesus?", "a": ["Pedro", "João", "André", "Tomé"], "c": 0, "cat": "Jesus", "d": 1, "ref": "Mateus 14:28–31", "exp": "Pedro saiu do barco e caminhou sobre as águas enquanto confiava em Jesus."}, {"q": "Quem disse a Jesus: 'Tu és o Cristo, o Filho do Deus vivo'?", "a": ["Pedro", "João", "Tomé", "Mateus"], "c": 0, "cat": "Jesus", "d": 1, "ref": "Mateus 16:16", "exp": "Pedro confessou Jesus como o Cristo e Filho do Deus vivo."}, {"q": "Quem apareceu com Jesus na transfiguração?", "a": ["Moisés e Elias", "Abraão e Davi", "Isaías e Jeremias", "Samuel e Eliseu"], "c": 0, "cat": "Jesus", "d": 2, "ref": "Mateus 17:1–3", "exp": "Moisés e Elias apareceram falando com Jesus no monte."}, {"q": "Qual discípulo perguntou quantas vezes deveria perdoar seu irmão?", "a": ["Pedro", "João", "Tiago", "Mateus"], "c": 0, "cat": "Jesus", "d": 2, "ref": "Mateus 18:21–22", "exp": "Pedro perguntou se deveria perdoar até sete vezes."}, {"q": "Quem foi chamado de 'filho da perdição' em João 17?", "a": ["Judas Iscariotes", "Pedro", "Tomé", "Caifás"], "c": 0, "cat": "Jesus", "d": 3, "ref": "João 17:12", "exp": "Jesus refere-se à perda daquele chamado 'filho da perdição'."}, {"q": "Em qual jardim Jesus orou antes de ser preso?", "a": ["Getsêmani", "Éden", "Gólgota", "Betânia"], "c": 0, "cat": "Jesus", "d": 1, "ref": "Mateus 26:36", "exp": "Jesus foi com os discípulos a um lugar chamado Getsêmani."}, {"q": "Quem entregou Jesus com um beijo?", "a": ["Judas Iscariotes", "Pedro", "Caifás", "Herodes"], "c": 0, "cat": "Jesus", "d": 1, "ref": "Lucas 22:47–48", "exp": "Judas se aproximou de Jesus e o identificou com um beijo."}, {"q": "Quem carregou a cruz de Jesus durante parte do caminho?", "a": ["Simão de Cirene", "José de Arimateia", "Pedro", "João"], "c": 0, "cat": "Jesus", "d": 1, "ref": "Lucas 23:26", "exp": "Simão de Cirene foi obrigado a carregar a cruz atrás de Jesus."}, {"q": "Qual discípulo esteve com Maria junto à cruz no relato de João?", "a": ["O discípulo amado", "Pedro", "Tomé", "Mateus"], "c": 0, "cat": "Jesus", "d": 2, "ref": "João 19:25–27", "exp": "Jesus confiou sua mãe ao discípulo a quem amava."}, {"q": "Quem chegou primeiro ao túmulo vazio no relato de João?", "a": ["O outro discípulo", "Pedro", "Tomé", "Tiago"], "c": 0, "cat": "Jesus", "d": 3, "ref": "João 20:3–4", "exp": "O outro discípulo correu mais depressa que Pedro e chegou primeiro ao túmulo."}, {"q": "A quem Jesus perguntou três vezes 'Tu me amas?' após a ressurreição?", "a": ["Pedro", "João", "Tomé", "André"], "c": 0, "cat": "Jesus", "d": 1, "ref": "João 21:15–17", "exp": "Jesus perguntou três vezes a Pedro sobre seu amor e lhe confiou o cuidado das ovelhas."}, {"q": "Em qual monte Jesus ascendeu segundo Atos?", "a": ["Monte das Oliveiras", "Monte Carmelo", "Monte Sinai", "Monte Tabor"], "c": 0, "cat": "Atos", "d": 2, "ref": "Atos 1:9–12", "exp": "Após a ascensão, os discípulos voltaram a Jerusalém do monte chamado das Oliveiras."}, {"q": "Quantos dias se passaram entre a ressurreição e a ascensão segundo Atos?", "a": ["40", "50", "7", "3"], "c": 0, "cat": "Atos", "d": 2, "ref": "Atos 1:3", "exp": "Jesus apresentou-se vivo durante quarenta dias."}, {"q": "Em qual festa o Espírito Santo foi derramado em Atos 2?", "a": ["Pentecostes", "Páscoa", "Tabernáculos", "Purim"], "c": 0, "cat": "Atos", "d": 1, "ref": "Atos 2:1–4", "exp": "O derramamento do Espírito aconteceu no dia de Pentecostes."}, {"q": "Quem pregou o sermão que resultou em cerca de três mil conversões?", "a": ["Pedro", "Paulo", "João", "Estêvão"], "c": 0, "cat": "Atos", "d": 1, "ref": "Atos 2:14,41", "exp": "Pedro pregou, e cerca de três mil pessoas receberam a palavra."}, {"q": "Quem curou um homem coxo na porta Formosa do templo?", "a": ["Pedro e João", "Paulo e Silas", "Barnabé e Marcos", "Filipe e Estêvão"], "c": 0, "cat": "Atos", "d": 2, "ref": "Atos 3:1–8", "exp": "Pedro e João encontraram o homem na porta do templo e ele foi curado."}, {"q": "Quem foi chamado de 'filho da consolação' pelos apóstolos?", "a": ["Barnabé", "Silas", "Marcos", "Timóteo"], "c": 0, "cat": "Atos", "d": 2, "ref": "Atos 4:36", "exp": "José, levita de Chipre, recebeu dos apóstolos o nome Barnabé."}, {"q": "Quem ficou cego temporariamente após encontrar Jesus no caminho de Damasco?", "a": ["Saulo", "Ananias", "Barnabé", "Silas"], "c": 0, "cat": "Atos", "d": 1, "ref": "Atos 9:3–9", "exp": "Saulo perdeu a visão após o encontro com Cristo e recuperou-a depois."}, {"q": "Quem foi enviado para orar por Saulo em Damasco?", "a": ["Ananias", "Barnabé", "Pedro", "Filipe"], "c": 0, "cat": "Atos", "d": 2, "ref": "Atos 9:10–18", "exp": "O Senhor enviou Ananias à casa onde Saulo estava."}, {"q": "Quem apresentou Saulo aos apóstolos em Jerusalém?", "a": ["Barnabé", "Pedro", "Tiago", "João"], "c": 0, "cat": "Atos", "d": 2, "ref": "Atos 9:26–27", "exp": "Barnabé tomou Saulo consigo e o apresentou aos apóstolos."}, {"q": "Qual centurião recebeu Pedro após uma visão?", "a": ["Cornélio", "Júlio", "Cláudio Lísias", "Félix"], "c": 0, "cat": "Atos", "d": 2, "ref": "Atos 10:1–5,24–48", "exp": "Cornélio, centurião de Cesareia, recebeu Pedro em sua casa."}, {"q": "Em qual cidade Paulo e Silas foram presos e cantaram hinos à meia-noite?", "a": ["Filipos", "Éfeso", "Corinto", "Antioquia"], "c": 0, "cat": "Atos", "d": 2, "ref": "Atos 16:22–26", "exp": "Em Filipos, Paulo e Silas oravam e cantavam quando ocorreu um terremoto."}, {"q": "Quem perguntou 'Que devo fazer para ser salvo?' após o terremoto na prisão?", "a": ["O carcereiro de Filipos", "Lídia", "Félix", "Agripa"], "c": 0, "cat": "Atos", "d": 2, "ref": "Atos 16:29–31", "exp": "O carcereiro perguntou a Paulo e Silas o que deveria fazer para ser salvo."}, {"q": "Qual cidade tinha um altar 'ao deus desconhecido'?", "a": ["Atenas", "Corinto", "Roma", "Éfeso"], "c": 0, "cat": "Atos", "d": 2, "ref": "Atos 17:22–23", "exp": "Paulo mencionou o altar ao Deus desconhecido ao falar no Areópago de Atenas."}, {"q": "Quem tentou comprar com dinheiro o poder de conceder o Espírito Santo?", "a": ["Simão, o mágico", "Ananias", "Elimas", "Demétrio"], "c": 0, "cat": "Atos", "d": 3, "ref": "Atos 8:18–24", "exp": "Simão ofereceu dinheiro aos apóstolos para receber esse poder."}, {"q": "Qual mágico ficou temporariamente cego ao resistir à pregação de Paulo?", "a": ["Elimas", "Simão", "Demétrio", "Tíquico"], "c": 0, "cat": "Atos", "d": 3, "ref": "Atos 13:8–11", "exp": "Elimas, também chamado Barjesus, ficou cego por um tempo."}, {"q": "Quem acompanhou Paulo e Barnabé no início da primeira viagem e depois voltou a Jerusalém?", "a": ["João Marcos", "Silas", "Lucas", "Timóteo"], "c": 0, "cat": "Atos", "d": 3, "ref": "Atos 13:5,13", "exp": "João Marcos os acompanhou inicialmente, mas voltou a Jerusalém."}, {"q": "Qual jovem discípulo passou a acompanhar Paulo em Listra?", "a": ["Timóteo", "Tito", "Apolo", "Silas"], "c": 0, "cat": "Atos", "d": 2, "ref": "Atos 16:1–3", "exp": "Timóteo era discípulo de Listra e foi escolhido para acompanhar Paulo."}, {"q": "Em qual cidade houve tumulto por causa do templo de Ártemis?", "a": ["Éfeso", "Corinto", "Filipos", "Tessalônica"], "c": 0, "cat": "Atos", "d": 2, "ref": "Atos 19:23–41", "exp": "Em Éfeso, artesãos ligados ao culto de Ártemis provocaram grande tumulto."}, {"q": "Qual governador ouviu Paulo e se assustou quando ele falou de justiça e juízo?", "a": ["Félix", "Festo", "Pilatos", "Quirino"], "c": 0, "cat": "Atos", "d": 3, "ref": "Atos 24:24–25", "exp": "Félix ficou atemorizado ao ouvir Paulo falar de justiça, domínio próprio e juízo."}, {"q": "Diante de qual rei Paulo apresentou sua defesa em Cesareia?", "a": ["Agripa", "Herodes, o Grande", "Saul", "Dario"], "c": 0, "cat": "Atos", "d": 2, "ref": "Atos 26:1–3", "exp": "Paulo apresentou sua defesa diante do rei Agripa."}, {"q": "Qual carta afirma que 'todos pecaram e carecem da glória de Deus'?", "a": ["Romanos", "Gálatas", "Efésios", "Hebreus"], "c": 0, "cat": "Bíblia", "d": 2, "ref": "Romanos 3:23", "exp": "Paulo declara em Romanos que todos pecaram e necessitam da graça de Deus."}, {"q": "Qual carta lista o fruto do Espírito?", "a": ["Gálatas", "Efésios", "Colossenses", "Filipenses"], "c": 0, "cat": "Bíblia", "d": 1, "ref": "Gálatas 5:22–23", "exp": "Gálatas apresenta amor, alegria, paz e outras virtudes como fruto do Espírito."}, {"q": "Qual carta contém a frase 'Tudo posso naquele que me fortalece'?", "a": ["Filipenses", "Efésios", "Colossenses", "Romanos"], "c": 0, "cat": "Bíblia", "d": 1, "ref": "Filipenses 4:13", "exp": "Paulo escreve sobre contentamento e força em Cristo."}, {"q": "Qual carta ensina que a fé sem obras é morta?", "a": ["Tiago", "Hebreus", "1 Pedro", "Romanos"], "c": 0, "cat": "Bíblia", "d": 1, "ref": "Tiago 2:17", "exp": "Tiago afirma que a fé sem obras é morta."}, {"q": "Qual carta fala sobre lançar toda ansiedade sobre Deus?", "a": ["1 Pedro", "2 Pedro", "Tiago", "Judas"], "c": 0, "cat": "Bíblia", "d": 2, "ref": "1 Pedro 5:7", "exp": "Pedro ensina a lançar sobre Deus toda ansiedade porque ele cuida de nós."}, {"q": "Qual livro declara que 'Deus é amor'?", "a": ["1 João", "João", "Romanos", "Hebreus"], "c": 0, "cat": "Bíblia", "d": 1, "ref": "1 João 4:8", "exp": "A primeira carta de João afirma que Deus é amor."}, {"q": "Qual carta do Novo Testamento possui apenas um capítulo e trata de um escravo chamado Onésimo?", "a": ["Filemom", "Judas", "2 João", "3 João"], "c": 0, "cat": "Bíblia", "d": 2, "ref": "Filemom 1:10–16", "exp": "Paulo escreve a Filemom a respeito de Onésimo."}, {"q": "Qual livro começa com cartas dirigidas às sete igrejas da Ásia?", "a": ["Apocalipse", "Atos", "Hebreus", "1 Pedro"], "c": 0, "cat": "Bíblia", "d": 1, "ref": "Apocalipse 1:4; 2–3", "exp": "Apocalipse contém mensagens às sete igrejas da Ásia."}, {"q": "Qual igreja do Apocalipse foi chamada de morna?", "a": ["Laodiceia", "Filadélfia", "Esmirna", "Éfeso"], "c": 0, "cat": "Bíblia", "d": 2, "ref": "Apocalipse 3:14–16", "exp": "Laodiceia foi repreendida por ser morna."}, {"q": "Qual igreja havia abandonado o primeiro amor?", "a": ["Éfeso", "Sardes", "Pérgamo", "Tiatira"], "c": 0, "cat": "Bíblia", "d": 2, "ref": "Apocalipse 2:1–4", "exp": "A igreja em Éfeso foi elogiada em vários aspectos, mas havia deixado o primeiro amor."}, {"q": "Quem escreveu: 'Combati o bom combate, terminei a carreira, guardei a fé'?", "a": ["Paulo", "Pedro", "João", "Tiago"], "c": 0, "cat": "Bíblia", "d": 1, "ref": "2 Timóteo 4:7", "exp": "Paulo faz essa declaração ao final de sua segunda carta a Timóteo."}];
const INDEX_HTML = "<!doctype html>\n<html lang=\"pt-BR\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover\">\n<meta name=\"theme-color\" content=\"#050b16\">\n<title>Desafio Bíblico Online</title>\n<link rel=\"stylesheet\" href=\"/style.css\">\n</head>\n<body>\n<div id=\"toast\" class=\"toast\"></div>\n<div id=\"countdown\" class=\"countdown hidden\"><div id=\"countNum\">3</div><span>PREPARE-SE!</span></div>\n\n<div class=\"app\">\n  <header class=\"topbar\">\n    <div class=\"miniBrand\"><span>📖</span><b>DESAFIO BÍBLICO</b><em>ONLINE</em></div>\n    <button id=\"soundBtn\" class=\"iconBtn\">🔊</button>\n  </header>\n\n  <main>\n    <!-- HOME -->\n    <section id=\"homeScreen\" class=\"screen active\">\n      <div class=\"hero\">\n        <div class=\"logo\">⚔️</div>\n        <h1>DESAFIO<br>BÍBLICO</h1>\n        <div class=\"onlineTag\">ONLINE 1×1</div>\n        <p>Crie uma sala, envie o link para um amigo e descubra quem conhece mais a Palavra.</p>\n      </div>\n\n      <div class=\"panel\">\n        <label>Seu nome</label>\n        <input id=\"nameInput\" maxlength=\"18\" placeholder=\"Digite seu nome\">\n        <label>Categoria da partida</label>\n        <select id=\"categorySelect\">\n          <option>Todas</option>\n          <option>Antigo Testamento</option>\n          <option>Novo Testamento</option>\n          <option>Jesus</option>\n          <option>Personagens</option>\n          <option>Atos</option>\n          <option>Bíblia</option>\n        </select>\n        <button id=\"createBtn\" class=\"primary\">⚔️ CRIAR DESAFIO ONLINE</button>\n      </div>\n\n      <div class=\"or\"><span>OU ENTRE NUMA SALA</span></div>\n\n      <div class=\"panel joinPanel\">\n        <input id=\"roomCodeInput\" maxlength=\"6\" autocomplete=\"off\" placeholder=\"CÓDIGO DA SALA\">\n        <button id=\"joinBtn\" class=\"secondary\">ENTRAR NA SALA</button>\n      </div>\n\n      <div class=\"features\">\n        <div><b>10</b><span>PERGUNTAS</span></div>\n        <div><b>20s</b><span>POR PERGUNTA</span></div>\n        <div><b>❤️ 1</b><span>SEGUNDA CHANCE</span></div>\n        <div><b>⚡</b><span>BÔNUS DE VELOCIDADE</span></div>\n      </div>\n      <button id=\"testSoundBtn\" class=\"textBtn\">🔊 Testar som</button>\n    </section>\n\n    <!-- WAITING -->\n    <section id=\"waitingScreen\" class=\"screen\">\n      <div class=\"waitingIcon\">📡</div>\n      <h2>Sala criada!</h2>\n      <p>Envie o código ou o link para a pessoa que vai desafiar você.</p>\n      <div class=\"roomCode\" id=\"roomCodeBig\">ABC123</div>\n      <button id=\"shareRoomBtn\" class=\"primary\">📤 ENVIAR CONVITE</button>\n      <button id=\"copyRoomBtn\" class=\"secondary\">🔗 COPIAR LINK</button>\n\n      <div class=\"playersBox\">\n        <div class=\"playerSlot ready\">\n          <div>🙂</div><span id=\"waitingYou\">Você</span><b>PRONTO</b>\n        </div>\n        <div class=\"vs\">VS</div>\n        <div id=\"opponentSlot\" class=\"playerSlot\">\n          <div>⏳</div><span>Esperando adversário...</span><b>AGUARDANDO</b>\n        </div>\n      </div>\n      <button id=\"leaveWaitingBtn\" class=\"textBtn\">Sair da sala</button>\n    </section>\n\n    <!-- GAME -->\n    <section id=\"gameScreen\" class=\"screen\">\n      <div class=\"scoreboard\">\n        <div class=\"scoreSide you\"><span id=\"youName\">Você</span><b id=\"youScore\">0</b><small id=\"youHeart\">❤️ 1</small></div>\n        <div class=\"scoreCenter\"><b>×</b><span id=\"questionCount\">1/10</span></div>\n        <div class=\"scoreSide opponent\"><span id=\"opName\">Adversário</span><b id=\"opScore\">0</b><small id=\"opHeart\">❤️ 1</small></div>\n      </div>\n\n      <div class=\"timerBar\"><div id=\"timerFill\"></div></div>\n      <div class=\"gameMeta\"><span id=\"categoryText\">BÍBLIA</span><b id=\"timerText\">20s</b></div>\n\n      <div id=\"questionCard\" class=\"questionCard\">\n        <h2 id=\"questionText\"></h2>\n        <div id=\"answers\" class=\"answers\"></div>\n      </div>\n\n      <div class=\"answerStatus\">\n        <span id=\"yourAnswerStatus\">Escolha uma resposta</span>\n        <span id=\"opAnswerStatus\">Adversário pensando...</span>\n      </div>\n\n      <div id=\"revealBox\" class=\"revealBox hidden\">\n        <div id=\"revealTitle\"></div>\n        <b id=\"correctAnswerText\"></b>\n        <span id=\"referenceText\"></span>\n        <p id=\"explanationText\"></p>\n      </div>\n    </section>\n\n    <!-- RESULT -->\n    <section id=\"resultScreen\" class=\"screen\">\n      <div id=\"resultIcon\" class=\"resultIcon\">🏆</div>\n      <h2 id=\"resultTitle\">Você venceu!</h2>\n      <p id=\"resultSubtitle\"></p>\n\n      <div class=\"finalScore\">\n        <div><span id=\"finalYouName\">Você</span><b id=\"finalYouScore\">0</b></div>\n        <em>×</em>\n        <div><span id=\"finalOpName\">Amigo</span><b id=\"finalOpScore\">0</b></div>\n      </div>\n\n      <button id=\"rematchBtn\" class=\"primary\">🔄 PEDIR REVANCHE</button>\n      <div id=\"rematchStatus\" class=\"rematchStatus\"></div>\n      <button id=\"shareResultBtn\" class=\"secondary\">📤 COMPARTILHAR RESULTADO</button>\n      <button id=\"backHomeBtn\" class=\"textBtn\">Voltar ao início</button>\n    </section>\n  </main>\n</div>\n\n<script src=\"/app.js\"></script>\n</body>\n</html>";
const STYLE_CSS = "\n:root{\n  --bg:#030810;--panel:#081a2d;--panel2:#0f2947;--gold:#f5bb43;--gold2:#ffe4a1;\n  --text:#fff9ea;--muted:#a9b9ce;--green:#35dc83;--red:#ff5f73;--blue:#58aaff;\n}\n*{box-sizing:border-box}\nhtml,body{margin:0;min-height:100%;background:#030810;color:var(--text);font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}\nbody:before{content:\"\";position:fixed;inset:0;z-index:-1;background:radial-gradient(circle at 50% -5%,#1d4a7e 0,transparent 40%),linear-gradient(#071423,#030810 72%)}\nbutton,input,select{font:inherit}\nbutton{cursor:pointer}\n.app{width:min(100vw,900px);min-height:100dvh;margin:auto;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}\n.topbar{height:58px;padding:10px 16px;display:flex;justify-content:space-between;align-items:center}\n.miniBrand{display:flex;align-items:center;gap:7px;font-size:11px}.miniBrand span{font-size:22px}.miniBrand b{color:var(--gold2)}.miniBrand em{font-style:normal;font-size:8px;background:#1d6a46;border:1px solid #42e19a66;padding:3px 6px;border-radius:99px}\n.iconBtn{width:40px;height:40px;border-radius:50%;border:1px solid #ffffff1d;background:#071624;color:#fff}\nmain{padding:0 18px 22px}.screen{display:none;min-height:calc(100dvh - 80px)}.screen.active{display:flex;flex-direction:column}\n.hero{text-align:center;margin:20px 0 12px}.logo{width:92px;height:92px;border-radius:50%;margin:0 auto 13px;display:grid;place-items:center;font-size:40px;background:linear-gradient(145deg,#ffe49a,#a76a10);box-shadow:0 0 52px #f5bb434f}\nh1{font-size:clamp(42px,11vw,70px);line-height:.87;letter-spacing:-.055em;margin:0}.onlineTag{display:inline-block;margin-top:10px;padding:5px 10px;border-radius:99px;background:#0b5b3d;border:1px solid #4ce8a072;font-weight:1000;font-size:11px;letter-spacing:.12em}\n.hero p{color:var(--muted);max-width:540px;margin:13px auto;line-height:1.45;font-size:13px}\n.panel{background:#081928d5;border:1px solid #ffffff15;border-radius:18px;padding:14px;margin:9px 0}\nlabel{display:block;font-size:10px;color:var(--gold2);font-weight:900;margin:6px 0}\ninput,select{width:100%;border:1px solid #ffffff1c;background:#10263f;color:#fff;border-radius:12px;padding:12px;margin-bottom:10px;outline:none}\ninput:focus,select:focus{border-color:#f5bb4375}\n#roomCodeInput{text-align:center;letter-spacing:.16em;text-transform:uppercase;font-size:20px;font-weight:1000}\n.primary,.secondary{width:100%;border-radius:14px;padding:13px 15px;font-weight:1000}\n.primary{border:0;background:linear-gradient(#ffe58f,#dea129);color:#291b03;box-shadow:0 8px 22px #0006}\n.secondary{border:1px solid #ffffff22;background:#0c2238;color:#fff}\n.textBtn{border:0;background:transparent;color:#aab9cc;padding:11px;text-align:center;width:100%}\n.or{display:flex;align-items:center;gap:10px;color:#718198;font-size:9px;font-weight:900;margin:3px 0}.or:before,.or:after{content:\"\";height:1px;background:#ffffff12;flex:1}\n.joinPanel{display:grid;grid-template-columns:1.3fr .9fr;gap:8px}.joinPanel input{margin:0}.joinPanel button{padding:10px}\n.features{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0}.features div{text-align:center;background:#071827;border:1px solid #ffffff10;border-radius:12px;padding:9px 3px}.features b{display:block;color:var(--gold2);font-size:14px}.features span{font-size:7px;color:var(--muted)}\n\n.waitingIcon{text-align:center;font-size:66px;margin-top:45px;animation:pulse 1.2s ease-in-out infinite alternate}@keyframes pulse{to{transform:scale(1.08);filter:drop-shadow(0 0 16px #58aaff)}}\n.screen h2{text-align:center;font-size:30px;margin:7px}.screen>p{text-align:center;color:var(--muted);font-size:13px;line-height:1.4}\n.roomCode{font-size:44px;font-weight:1000;color:var(--gold2);letter-spacing:.15em;text-align:center;margin:16px 0;text-shadow:0 0 22px #f5bb4344}\n.playersBox{display:grid;grid-template-columns:1fr auto 1fr;gap:7px;align-items:center;margin:20px 0}.playerSlot{text-align:center;background:#071827;border:1px dashed #ffffff20;border-radius:16px;padding:15px 7px;min-height:116px}.playerSlot.ready{border-style:solid;border-color:#43dd9270}.playerSlot div{font-size:30px}.playerSlot span{display:block;font-weight:900;margin-top:5px}.playerSlot b{font-size:8px;color:#7e8da1}.playerSlot.ready b{color:#5be19b}.vs{font-weight:1000;color:var(--gold2)}\n\n.scoreboard{display:grid;grid-template-columns:1fr auto 1fr;gap:7px;align-items:center;margin-top:10px}.scoreSide{background:#071827;border:1px solid #ffffff13;border-radius:15px;padding:9px}.scoreSide span{display:block;font-size:10px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.scoreSide b{display:block;font-size:25px;color:var(--gold2)}.scoreSide small{font-size:9px}.scoreSide.opponent{text-align:right}.scoreCenter{text-align:center}.scoreCenter b{display:block;color:var(--gold2);font-size:20px}.scoreCenter span{font-size:9px;color:var(--muted)}\n.timerBar{height:8px;background:#ffffff12;border-radius:99px;overflow:hidden;margin-top:10px}.timerBar div{height:100%;width:100%;background:linear-gradient(90deg,#4fdc94,#f5bb43,#ff6375);transform-origin:left;transition:width .1s linear}\n.gameMeta{display:flex;justify-content:space-between;font-size:9px;color:var(--gold2);font-weight:900;margin:8px 2px}\n.questionCard{background:linear-gradient(#102c4b,#081826);border:1px solid #ffffff1b;border-radius:21px;padding:18px;box-shadow:0 18px 48px #0007}\n.questionCard h2{text-align:center;font-size:clamp(21px,5.5vw,31px);line-height:1.24;margin:4px 0 16px}\n.answers{display:grid;gap:9px}.answer{border:1px solid #ffffff1f;background:linear-gradient(#153653,#0c2239);color:#fff;border-radius:15px;padding:12px;text-align:left;display:flex;align-items:center;gap:9px;font-weight:850}.answer:disabled{opacity:.72}.answer .letter{width:32px;height:32px;flex:0 0 32px;border-radius:50%;display:grid;place-items:center;background:#ffffff10;color:var(--gold2);font-weight:1000}.answer.selected{border-color:#58aaff;box-shadow:0 0 18px #58aaff2f}.answer.correct{background:#10583a;border-color:#52e99c}.answer.wrong{background:#671d2e;border-color:#ff6a7d}\n.answerStatus{display:flex;justify-content:space-between;gap:8px;padding:10px 3px;color:#91a2b8;font-size:9px}.answerStatus span:last-child{text-align:right}\n.revealBox{margin-top:7px;border:1px solid #ffffff16;background:#071522;border-radius:15px;padding:12px;text-align:center}.revealBox.hidden{display:none}.revealBox div{font-weight:1000;font-size:18px}.revealBox b{display:block;color:var(--gold2);font-size:15px;margin:5px}.revealBox span{font-size:10px;color:#65b4ff}.revealBox p{font-size:10px;color:var(--muted);line-height:1.4;margin:5px}\n\n.countdown{position:fixed;inset:0;background:#02060dda;z-index:100;display:grid;place-items:center;text-align:center;align-content:center}.countdown.hidden{display:none}.countdown div{font-size:100px;font-weight:1000;color:var(--gold2);text-shadow:0 0 45px #f5bb43}.countdown span{font-weight:1000;letter-spacing:.14em}\n.resultIcon{text-align:center;font-size:78px;margin-top:42px}.finalScore{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin:20px 0}.finalScore div{background:#081827;border:1px solid #ffffff13;border-radius:16px;padding:15px;text-align:center}.finalScore span{display:block;color:var(--muted);font-size:10px}.finalScore b{font-size:35px;color:var(--gold2)}.finalScore em{font-style:normal;font-size:24px;font-weight:1000}.rematchStatus{text-align:center;color:#aab9cd;min-height:32px;padding:8px;font-size:11px}\n.toast{position:fixed;left:50%;bottom:30px;transform:translate(-50%,25px);opacity:0;background:#111f31;color:#fff;border:1px solid #ffffff20;border-radius:12px;padding:10px 15px;z-index:120;font-size:11px;pointer-events:none;transition:.25s}.toast.show{opacity:1;transform:translate(-50%,0)}\n@media(min-width:720px){main{padding:0 50px 30px}.answers{grid-template-columns:1fr 1fr}.questionCard{padding:27px}.features{max-width:600px;margin:13px auto;width:100%}}\n";
const APP_JS = "\nconst $ = id => document.getElementById(id);\nlet session = null;\nlet eventSource = null;\nlet roomState = null;\nlet currentQuestion = null;\nlet timerRAF = null;\nlet soundOn = localStorage.getItem('dbo_sound') !== '0';\nlet audioCtx = null;\nlet lastResult = null;\n\nfunction show(id) {\n  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));\n  $(id).classList.add('active');\n}\nfunction toast(msg) {\n  const t=$('toast');t.textContent=msg;t.classList.add('show');\n  clearTimeout(t._to);t._to=setTimeout(()=>t.classList.remove('show'),1800);\n}\nfunction saveName(){localStorage.setItem('dbo_name',$('nameInput').value.trim())}\nfunction loadName(){ $('nameInput').value=localStorage.getItem('dbo_name')||''; }\n\nfunction ensureAudio(){\n  const AC=window.AudioContext||window.webkitAudioContext;\n  if(!AC)return null;\n  if(!audioCtx)audioCtx=new AC();\n  if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});\n  return audioCtx;\n}\nfunction tone(freq,dur=.18,vol=.045,type='sine',delay=0){\n  if(!soundOn)return;const c=ensureAudio();if(!c)return;\n  const n=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();\n  o.type=type;o.frequency.setValueAtTime(freq,n);\n  g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(Math.max(.001,vol),n+.012);g.gain.exponentialRampToValueAtTime(.0001,n+dur);\n  o.connect(g);g.connect(c.destination);o.start(n);o.stop(n+dur+.02);\n}\nfunction sound(k){\n  if(k==='start'){tone(294,.22,.06,'triangle');tone(370,.25,.06,'triangle',.12);tone(440,.35,.06,'triangle',.23)}\n  if(k==='correct'){tone(523,.2,.06);tone(659,.25,.06,'sine',.1);tone(784,.32,.065,'sine',.2)}\n  if(k==='wrong'){tone(180,.35,.06,'sawtooth');tone(105,.42,.04,'square',.08)}\n  if(k==='heart'){tone(70,.1,.075);tone(70,.12,.065,'sine',.2);tone(440,.4,.05,'triangle',.48)}\n  if(k==='victory'){[392,523,659,784,1046].forEach((f,i)=>tone(f,.5,.06,'triangle',i*.13))}\n  if(k==='tick'){tone(900,.05,.022,'square')}\n}\nfunction setSound(v){soundOn=!!v;localStorage.setItem('dbo_sound',soundOn?'1':'0');$('soundBtn').textContent=soundOn?'🔊':'🔇'}\n\nasync function api(path, body) {\n  const r = await fetch(path,{\n    method:'POST',headers:{'Content-Type':'application/json'},\n    body:JSON.stringify(body)\n  });\n  const j=await r.json().catch(()=>({}));\n  if(!r.ok) throw Object.assign(new Error(j.error||'ERROR'),{code:j.error,status:r.status});\n  return j;\n}\nfunction closeEvents(){if(eventSource){eventSource.close();eventSource=null}}\nfunction connectEvents() {\n  closeEvents();\n  const q=new URLSearchParams({code:session.code,playerId:session.playerId,token:session.token});\n  eventSource=new EventSource('/events?'+q);\n  eventSource.onmessage=e=>{\n    const msg=JSON.parse(e.data);\n    handleEvent(msg);\n  };\n  eventSource.onerror=()=>{};\n}\nfunction updateWaiting(room){\n  roomState=room;\n  $('roomCodeBig').textContent=room.code;\n  const you=room.players.find(p=>p.id===session.playerId);\n  const op=room.players.find(p=>p.id!==session.playerId);\n  $('waitingYou').textContent=you?.name||'Você';\n  const slot=$('opponentSlot');\n  if(op){\n    slot.classList.add('ready');\n    slot.innerHTML=`<div>🙂</div><span>${escapeHtml(op.name)}</span><b>ENTROU!</b>`;\n  }else{\n    slot.classList.remove('ready');\n    slot.innerHTML='<div>⏳</div><span>Esperando adversário...</span><b>AGUARDANDO</b>';\n  }\n}\nfunction escapeHtml(s){return String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]))}\n\nfunction handleEvent(msg){\n  if(msg.type==='connected'){\n    roomState=msg.room;\n    if(msg.room.status==='waiting'){show('waitingScreen');updateWaiting(msg.room)}\n    return;\n  }\n  if(msg.type==='opponent-connection'){\n    if($('waitingScreen').classList.contains('active') && roomState){\n      const p=roomState.players.find(x=>x.id===msg.opponent.id);\n      if(p) Object.assign(p,msg.opponent);\n      updateWaiting(roomState);\n    }\n    if(!msg.connected) toast('Adversário desconectou. Aguardando reconexão…');\n    else toast('Adversário conectado.');\n    return;\n  }\n  if(msg.type==='match-starting'){\n    roomState=msg.room;\n    const you=roomState.players.find(p=>p.id===session.playerId);\n    const op=roomState.players.find(p=>p.id!==session.playerId);\n    $('youName').textContent=you?.name||'Você';$('opName').textContent=op?.name||'Adversário';\n    showCountdown(msg.startsAt);\n    return;\n  }\n  if(msg.type==='question'){renderQuestion(msg);return}\n  if(msg.type==='answer-accepted'){\n    $('yourAnswerStatus').textContent=msg.heartUsed?'❤️ Segunda Chance utilizada':'✓ Resposta enviada';\n    if(msg.heartUsed)sound('heart');\n    return;\n  }\n  if(msg.type==='opponent-answered'){\n    $('opAnswerStatus').textContent='✓ Adversário respondeu';\n    return;\n  }\n  if(msg.type==='reveal'){renderReveal(msg);return}\n  if(msg.type==='match-finished'){renderResult(msg);return}\n  if(msg.type==='rematch-state'){\n    roomState.players=msg.players;\n    const me=msg.players.find(p=>p.id===session.playerId);\n    const op=msg.players.find(p=>p.id!==session.playerId);\n    if(me?.rematch && !op?.rematch)$('rematchStatus').textContent='Pedido enviado. Aguardando o adversário…';\n    if(op?.rematch && !me?.rematch)$('rematchStatus').textContent='Seu adversário quer revanche!';\n    return;\n  }\n}\nfunction showCountdown(startsAt){\n  show('gameScreen');\n  $('countdown').classList.remove('hidden');\n  sound('start');\n  const run=()=>{\n    const n=Math.ceil((startsAt-Date.now())/1000);\n    $('countNum').textContent=n>0?n:'VALENDO!';\n    if(n>0)setTimeout(run,180);\n    else setTimeout(()=>$('countdown').classList.add('hidden'),450);\n  };\n  run();\n}\nfunction updateScores(players){\n  const me=players.find(p=>p.id===session.playerId),op=players.find(p=>p.id!==session.playerId);\n  if(me){$('youScore').textContent=me.score;$('youHeart').textContent=me.heart?'❤️ 1':'♡ 0'}\n  if(op){$('opScore').textContent=op.score;$('opHeart').textContent=op.heart?'❤️ 1':'♡ 0';$('opName').textContent=op.name}\n}\nfunction renderQuestion(msg){\n  currentQuestion=msg;\n  show('gameScreen');$('countdown').classList.add('hidden');\n  $('questionCount').textContent=`${msg.index+1}/${msg.total}`;\n  $('categoryText').textContent=msg.category.toUpperCase();\n  $('questionText').textContent=msg.text;\n  $('yourAnswerStatus').textContent='Escolha uma resposta';\n  $('opAnswerStatus').textContent='Adversário pensando…';\n  $('revealBox').classList.add('hidden');\n  updateScores(msg.players);\n  const box=$('answers');box.innerHTML='';\n  ['A','B','C','D'].forEach((letter,i)=>{\n    const b=document.createElement('button');b.className='answer';\n    b.innerHTML=`<span class=\"letter\">${letter}</span><span>${escapeHtml(msg.answers[i])}</span>`;\n    b.onclick=()=>submitAnswer(i,b);\n    box.appendChild(b);\n  });\n  startTimer(msg.startedAt,msg.timeLimitMs);\n}\nasync function submitAnswer(i,button){\n  document.querySelectorAll('.answer').forEach(b=>b.disabled=true);\n  button.classList.add('selected');\n  $('yourAnswerStatus').textContent='Enviando resposta…';\n  try{\n    await api('/api/action',{code:session.code,playerId:session.playerId,token:session.token,action:'answer',choice:i});\n  }catch(e){\n    toast('Não foi possível enviar a resposta.');\n  }\n}\nfunction startTimer(startedAt,limit){\n  cancelAnimationFrame(timerRAF);\n  const run=()=>{\n    const remaining=Math.max(0,limit-(Date.now()-startedAt));\n    const pct=remaining/limit*100;\n    $('timerFill').style.width=pct+'%';\n    $('timerText').textContent=Math.ceil(remaining/1000)+'s';\n    if(remaining>0)timerRAF=requestAnimationFrame(run);\n  };run();\n}\nfunction renderReveal(msg){\n  cancelAnimationFrame(timerRAF);$('timerFill').style.width='0%';\n  const mine=msg.players.find(p=>p.id===session.playerId);\n  const op=msg.players.find(p=>p.id!==session.playerId);\n  updateScores(msg.players.map(p=>({id:p.id,name:p.name,score:p.score,heart:p.heart})));\n\n  document.querySelectorAll('.answer').forEach((b,i)=>{\n    b.disabled=true;\n    if(i===msg.correctIndex)b.classList.add('correct');\n    if(mine?.answer?.choice===i && !mine.answer.correct)b.classList.add('wrong');\n  });\n\n  const title=$('revealTitle');\n  if(mine?.answer?.correct){title.textContent=`✅ +${mine.answer.points} pontos`;title.style.color='#5be09a';sound('correct')}\n  else if(mine?.answer?.heartUsed){title.textContent='❤️ Segunda Chance! Você continua.';title.style.color='#ffb4c2';sound('heart')}\n  else if(mine?.answer?.timedOut){title.textContent='⌛ Tempo esgotado';title.style.color='#ff9aab';sound('wrong')}\n  else{title.textContent='❌ Resposta incorreta';title.style.color='#ff7b8e';sound('wrong')}\n\n  $('correctAnswerText').textContent='Resposta: '+msg.correctText;\n  $('referenceText').textContent='📖 '+msg.reference;\n  $('explanationText').textContent=msg.explanation;\n  $('revealBox').classList.remove('hidden');\n\n  $('yourAnswerStatus').textContent=mine?.answer?.correct?'Você acertou!':mine?.answer?.heartUsed?'Sua Segunda Chance foi usada':'Você não pontuou';\n  $('opAnswerStatus').textContent=op?.answer?.correct?`${op.name} acertou`:`${op?.name||'Adversário'} não pontuou`;\n}\nfunction renderResult(msg){\n  cancelAnimationFrame(timerRAF);roomState=msg.room;\n  const me=msg.players.find(p=>p.id===session.playerId),op=msg.players.find(p=>p.id!==session.playerId);\n  lastResult={me,op,winnerId:msg.winnerId,tie:msg.tie};\n  show('resultScreen');\n  $('finalYouName').textContent=me.name;$('finalYouScore').textContent=me.score;\n  $('finalOpName').textContent=op.name;$('finalOpScore').textContent=op.score;\n  $('rematchBtn').disabled=false;$('rematchBtn').textContent='🔄 PEDIR REVANCHE';$('rematchStatus').textContent='';\n  if(msg.tie){\n    $('resultIcon').textContent='🤝';$('resultTitle').textContent='Empate!';$('resultSubtitle').textContent='Vocês terminaram com a mesma pontuação.';\n  }else if(msg.winnerId===session.playerId){\n    $('resultIcon').textContent='🏆';$('resultTitle').textContent='Você venceu!';$('resultSubtitle').textContent=`Parabéns! Você venceu ${op.name}.`;sound('victory');\n  }else{\n    $('resultIcon').textContent='📖';$('resultTitle').textContent=`${op.name} venceu`; $('resultSubtitle').textContent='Revanche? A próxima pode ser sua.';\n  }\n}\nasync function createRoom(){\n  const name=$('nameInput').value.trim();if(!name){toast('Digite seu nome.');return}\n  saveName();ensureAudio();sound('start');\n  try{\n    const j=await api('/api/create-room',{name,category:$('categorySelect').value});\n    session={code:j.code,playerId:j.playerId,token:j.token};\n    sessionStorage.setItem('dbo_session',JSON.stringify(session));\n    history.replaceState(null,'',`/?room=${j.code}`);\n    show('waitingScreen');updateWaiting(j.room);connectEvents();\n  }catch(e){toast('Não foi possível criar a sala.')}\n}\nasync function joinRoom(){\n  const name=$('nameInput').value.trim();const code=$('roomCodeInput').value.trim().toUpperCase();\n  if(!name){toast('Digite seu nome.');return} if(code.length<4){toast('Digite o código da sala.');return}\n  saveName();ensureAudio();sound('start');\n  try{\n    const j=await api('/api/join-room',{name,code});\n    session={code:j.code,playerId:j.playerId,token:j.token};\n    sessionStorage.setItem('dbo_session',JSON.stringify(session));\n    history.replaceState(null,'',`/?room=${j.code}`);\n    show('waitingScreen');updateWaiting(j.room);connectEvents();\n  }catch(e){\n    if(e.code==='ROOM_NOT_FOUND')toast('Sala não encontrada.');\n    else if(e.code==='ROOM_UNAVAILABLE')toast('Essa sala já começou ou está cheia.');\n    else toast('Não foi possível entrar.');\n  }\n}\nfunction inviteUrl(){\n  const u=new URL(location.href);u.search='';u.searchParams.set('room',session.code);return u.toString();\n}\nasync function shareRoom(){\n  const text=`⚔️ Te desafio no Desafio Bíblico!\\nSala: ${session.code}\\n${inviteUrl()}`;\n  try{\n    if(navigator.share)await navigator.share({title:'Desafio Bíblico Online',text,url:inviteUrl()});\n    else{await navigator.clipboard.writeText(text);toast('Convite copiado!')}\n  }catch(e){}\n}\nasync function copyRoom(){\n  try{await navigator.clipboard.writeText(inviteUrl());toast('Link copiado!')}catch(e){toast('Código da sala: '+session.code)}\n}\nasync function rematch(){\n  $('rematchBtn').disabled=true;$('rematchBtn').textContent='REVANCHE SOLICITADA';\n  try{await api('/api/action',{code:session.code,playerId:session.playerId,token:session.token,action:'rematch'});}\n  catch(e){$('rematchBtn').disabled=false;toast('Não foi possível pedir revanche.')}\n}\nasync function shareResult(){\n  if(!lastResult)return;\n  const {me,op,winnerId,tie}=lastResult;\n  const text=`📖 Desafio Bíblico Online\\n${me.name} ${me.score} × ${op.score} ${op.name}\\n${tie?'🤝 Empate!':winnerId===session.playerId?'🏆 Eu venci!':`🏆 ${op.name} venceu!`}`;\n  try{if(navigator.share)await navigator.share({title:'Desafio Bíblico',text});else{await navigator.clipboard.writeText(text);toast('Resultado copiado!')}}catch(e){}\n}\nfunction goHome(){\n  closeEvents();session=null;sessionStorage.removeItem('dbo_session');history.replaceState(null,'','/');\n  show('homeScreen');\n}\nasync function tryRestore(){\n  const saved=sessionStorage.getItem('dbo_session');\n  if(!saved)return false;\n  try{\n    session=JSON.parse(saved);\n    const q=new URLSearchParams({code:session.code,playerId:session.playerId,token:session.token});\n    const r=await fetch('/api/state?'+q);if(!r.ok)throw 0;\n    const j=await r.json();roomState=j.room;connectEvents();\n    if(j.room.status==='waiting'){show('waitingScreen');updateWaiting(j.room)}\n    else{show('waitingScreen');updateWaiting(j.room);toast('Reconectando à partida…')}\n    return true;\n  }catch(e){session=null;sessionStorage.removeItem('dbo_session');return false}\n}\n\n$('createBtn').onclick=createRoom;$('joinBtn').onclick=joinRoom;\n$('shareRoomBtn').onclick=shareRoom;$('copyRoomBtn').onclick=copyRoom;\n$('leaveWaitingBtn').onclick=goHome;$('backHomeBtn').onclick=goHome;\n$('rematchBtn').onclick=rematch;$('shareResultBtn').onclick=shareResult;\n$('soundBtn').onclick=()=>setSound(!soundOn);\n$('testSoundBtn').onclick=()=>{ensureAudio();sound('start');setTimeout(()=>sound('correct'),500)};\n$('roomCodeInput').addEventListener('input',e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6));\n$('nameInput').addEventListener('change',saveName);\nwindow.addEventListener('beforeunload',closeEvents);\n\n(async function init(){\n  loadName();setSound(soundOn);\n  const room=new URL(location.href).searchParams.get('room');\n  if(room)$('roomCodeInput').value=room.toUpperCase().slice(0,6);\n  const restored=await tryRestore();\n  if(!restored)show('homeScreen');\n})();\n";

const rooms = new Map();
const ROOM_TTL_MS = 45 * 60 * 1000;
const QUESTION_MS = 20_000;
const REVEAL_MS = 4_000;

function now() { return Date.now(); }
function id(bytes=12) { return crypto.randomBytes(bytes).toString('hex'); }
function cleanName(v) {
  const s = String(v || '').trim().replace(/\s+/g, ' ');
  return s.slice(0, 18) || 'Jogador';
}
function cleanCategory(v) {
  const allowed = new Set([
    'Todas', 'Antigo Testamento', 'Novo Testamento',
    'Jesus', 'Personagens', 'Atos', 'Bíblia'
  ]);
  return allowed.has(v) ? v : 'Todas';
}
function roomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt=0; attempt<100; attempt++) {
    let code = '';
    for (let i=0;i<6;i++) code += alphabet[Math.floor(Math.random()*alphabet.length)];
    if (!rooms.has(code)) return code;
  }
  return String(Math.floor(100000 + Math.random()*900000));
}
function shuffle(arr, rnd=Math.random) {
  const a = [...arr];
  for (let i=a.length-1; i>0; i--) {
    const j = Math.floor(rnd()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function balancedPositions(n) {
  return shuffle(Array.from({length:n}, (_,i)=>i%4));
}
function prepareQuestion(raw, targetCorrect) {
  const correctText = raw.a[raw.c];
  const wrong = shuffle(raw.a.filter((_,i)=>i!==raw.c));
  const answers = [];
  let wi = 0;
  for (let i=0;i<4;i++) answers.push(i===targetCorrect ? correctText : wrong[wi++]);
  return {
    q: raw.q,
    a: answers,
    c: targetCorrect,
    cat: raw.cat,
    d: raw.d,
    ref: raw.ref,
    exp: raw.exp
  };
}
function selectQuestions(category) {
  const cat = cleanCategory(category);
  function pool(d) {
    const filtered = QUESTIONS.filter(q => q.d === d && (cat === 'Todas' || q.cat === cat));
    return filtered.length >= 4 ? filtered : QUESTIONS.filter(q => q.d === d);
  }
  const raw = [
    ...shuffle(pool(1)).slice(0,3),
    ...shuffle(pool(2)).slice(0,3),
    ...shuffle(pool(3)).slice(0,4)
  ];
  const positions = balancedPositions(raw.length);
  return raw.map((q,i)=>prepareQuestion(q,positions[i]));
}

function publicPlayer(p) {
  return {
    id: p.id,
    name: p.name,
    score: p.score,
    heart: p.heart,
    connected: p.connected,
    answered: !!p.answer,
    rematch: !!p.rematch
  };
}
function roomSummary(room, forPlayerId=null) {
  return {
    code: room.code,
    category: room.category,
    status: room.status,
    questionIndex: room.questionIndex,
    total: room.questions.length,
    players: room.players.map(publicPlayer),
    you: forPlayerId
  };
}
function writeSSE(res, obj) {
  try {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  } catch (_) {}
}
function sendPlayer(player, type, payload={}) {
  if (player && player.sse) writeSSE(player.sse, {type, ...payload});
}
function broadcast(room, type, payload={}) {
  for (const p of room.players) sendPlayer(p, type, payload);
}
function touch(room) { room.updatedAt = now(); }
function findPlayer(room, playerId, token) {
  const p = room.players.find(p=>p.id===playerId);
  if (!p || p.token !== token) return null;
  return p;
}
function opponent(room, p) { return room.players.find(x=>x.id!==p.id) || null; }

function createRoom(name, category) {
  const code = roomCode();
  const player = {
    id: id(8), token: id(16), name: cleanName(name),
    score: 0, heart: 1, connected: false, sse: null,
    answer: null, rematch: false
  };
  const room = {
    code, category: cleanCategory(category),
    createdAt: now(), updatedAt: now(),
    status: 'waiting',
    players: [player],
    questions: [],
    questionIndex: -1,
    questionStartedAt: 0,
    questionTimer: null,
    revealTimer: null,
    matchNumber: 0
  };
  rooms.set(code, room);
  return {room, player};
}

function addPlayer(room, name) {
  if (room.players.length >= 2) throw new Error('ROOM_FULL');
  const player = {
    id: id(8), token: id(16), name: cleanName(name),
    score: 0, heart: 1, connected: false, sse: null,
    answer: null, rematch: false
  };
  room.players.push(player);
  touch(room);
  return player;
}

function resetMatch(room) {
  clearTimeout(room.questionTimer);
  clearTimeout(room.revealTimer);
  room.questions = selectQuestions(room.category);
  room.questionIndex = -1;
  room.matchNumber++;
  for (const p of room.players) {
    p.score = 0;
    p.heart = 1;
    p.answer = null;
    p.rematch = false;
  }
}

function startCountdown(room) {
  if (room.players.length !== 2) return;
  resetMatch(room);
  room.status = 'countdown';
  touch(room);
  const startsAt = now() + 3000;
  broadcast(room, 'match-starting', {
    startsAt,
    room: roomSummary(room)
  });
  setTimeout(()=>{
    if (!rooms.has(room.code) || room.status !== 'countdown') return;
    room.status = 'playing';
    startQuestion(room);
  }, 3000);
}

function questionPayload(room) {
  const q = room.questions[room.questionIndex];
  return {
    index: room.questionIndex,
    total: room.questions.length,
    text: q.q,
    answers: q.a,
    category: q.cat,
    difficulty: q.d,
    timeLimitMs: QUESTION_MS,
    startedAt: room.questionStartedAt,
    players: room.players.map(publicPlayer)
  };
}

function startQuestion(room) {
  clearTimeout(room.questionTimer);
  room.questionIndex++;
  if (room.questionIndex >= room.questions.length) {
    finishMatch(room);
    return;
  }
  room.status = 'playing';
  room.questionStartedAt = now();
  for (const p of room.players) p.answer = null;
  touch(room);
  broadcast(room, 'question', questionPayload(room));
  room.questionTimer = setTimeout(()=>endQuestion(room, 'timeout'), QUESTION_MS);
}

function registerAnswer(room, player, choice) {
  if (room.status !== 'playing') return {ok:false, error:'NOT_PLAYING'};
  if (player.answer) return {ok:false, error:'ALREADY_ANSWERED'};
  if (!Number.isInteger(choice) || choice < 0 || choice > 3) return {ok:false, error:'BAD_CHOICE'};

  const q = room.questions[room.questionIndex];
  const elapsed = Math.max(0, now() - room.questionStartedAt);
  const correct = choice === q.c;
  let points = 0;
  let heartUsed = false;

  if (correct) {
    // 100 base + up to 100 speed bonus.
    const remaining = Math.max(0, QUESTION_MS - elapsed);
    points = 100 + Math.floor(remaining / 200);
    player.score += points;
  } else if (player.heart > 0) {
    player.heart = 0;
    heartUsed = true;
  }

  player.answer = {
    choice, correct, elapsed, points, heartUsed, timedOut:false
  };
  touch(room);

  const other = opponent(room, player);
  sendPlayer(player, 'answer-accepted', {
    index: room.questionIndex,
    answered: true,
    heartUsed,
    score: player.score
  });
  if (other) sendPlayer(other, 'opponent-answered', {
    index: room.questionIndex,
    opponentId: player.id
  });

  if (room.players.every(p=>p.answer)) {
    clearTimeout(room.questionTimer);
    room.questionTimer = setTimeout(()=>endQuestion(room, 'both-answered'), 550);
  }
  return {ok:true};
}

function endQuestion(room, reason) {
  if (room.status !== 'playing') return;
  clearTimeout(room.questionTimer);
  const q = room.questions[room.questionIndex];

  // Unanswered players time out. First timeout consumes heart.
  for (const p of room.players) {
    if (!p.answer) {
      const heartUsed = p.heart > 0;
      if (heartUsed) p.heart = 0;
      p.answer = {
        choice:null, correct:false, elapsed:QUESTION_MS,
        points:0, heartUsed, timedOut:true
      };
    }
  }

  room.status = 'reveal';
  touch(room);
  broadcast(room, 'reveal', {
    index: room.questionIndex,
    correctIndex: q.c,
    correctText: q.a[q.c],
    reference: q.ref,
    explanation: q.exp,
    reason,
    players: room.players.map(p=>({
      id:p.id, name:p.name, score:p.score, heart:p.heart,
      answer:p.answer
    }))
  });

  room.revealTimer = setTimeout(()=>{
    if (!rooms.has(room.code) || room.status !== 'reveal') return;
    startQuestion(room);
  }, REVEAL_MS);
}

function finishMatch(room) {
  clearTimeout(room.questionTimer);
  clearTimeout(room.revealTimer);
  room.status = 'finished';
  touch(room);
  const a = room.players[0], b = room.players[1];
  let winnerId = null;
  if (a.score > b.score) winnerId = a.id;
  else if (b.score > a.score) winnerId = b.id;
  broadcast(room, 'match-finished', {
    winnerId,
    tie: winnerId === null,
    players: room.players.map(publicPlayer),
    room: roomSummary(room)
  });
}

function requestRematch(room, player) {
  if (room.status !== 'finished') return {ok:false,error:'NOT_FINISHED'};
  player.rematch = true;
  touch(room);
  broadcast(room, 'rematch-state', {players:room.players.map(publicPlayer)});
  if (room.players.length===2 && room.players.every(p=>p.rematch)) {
    setTimeout(()=>startCountdown(room), 700);
  }
  return {ok:true};
}

// ------------------------------------------------------------
// HTTP helpers
// ------------------------------------------------------------
function sendText(res, status, contentType, text, cache='no-store') {
  const data = Buffer.from(text, 'utf8');
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': data.length,
    'Cache-Control': cache
  });
  res.end(data);
}
function serveStatic(req,res,urlObj) {
  if (urlObj.pathname === '/style.css') {
    return sendText(res,200,'text/css; charset=utf-8',STYLE_CSS,'public, max-age=3600');
  }
  if (urlObj.pathname === '/app.js') {
    return sendText(res,200,'application/javascript; charset=utf-8',APP_JS,'public, max-age=3600');
  }
  return sendText(res,200,'text/html; charset=utf-8',INDEX_HTML,'no-store');
}

const server = http.createServer(async (req,res)=>{
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // CORS not needed when served together, but OPTIONS is harmless.
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':'*',
      'Access-Control-Allow-Headers':'Content-Type',
      'Access-Control-Allow-Methods':'GET,POST,OPTIONS'
    });
    return res.end();
  }

  try {
    if (req.method==='POST' && urlObj.pathname==='/api/create-room') {
      const body=await readBody(req);
      const {room,player}=createRoom(body.name,body.category);
      return json(res,200,{
        ok:true, code:room.code, playerId:player.id, token:player.token,
        room:roomSummary(room,player.id)
      });
    }

    if (req.method==='POST' && urlObj.pathname==='/api/join-room') {
      const body=await readBody(req);
      const code=String(body.code||'').trim().toUpperCase();
      const room=rooms.get(code);
      if(!room) return json(res,404,{ok:false,error:'ROOM_NOT_FOUND'});
      if(room.status!=='waiting' || room.players.length>=2) {
        return json(res,409,{ok:false,error:'ROOM_UNAVAILABLE'});
      }
      const player=addPlayer(room,body.name);
      json(res,200,{
        ok:true, code, playerId:player.id, token:player.token,
        room:roomSummary(room,player.id)
      });
      // Let response reach client before countdown event.
      setTimeout(()=>startCountdown(room),400);
      return;
    }

    if (req.method==='POST' && urlObj.pathname==='/api/action') {
      const body=await readBody(req);
      const code=String(body.code||'').trim().toUpperCase();
      const room=rooms.get(code);
      if(!room) return json(res,404,{ok:false,error:'ROOM_NOT_FOUND'});
      const player=findPlayer(room,body.playerId,body.token);
      if(!player) return json(res,403,{ok:false,error:'AUTH'});
      let result;
      if(body.action==='answer') result=registerAnswer(room,player,Number(body.choice));
      else if(body.action==='rematch') result=requestRematch(room,player);
      else return json(res,400,{ok:false,error:'BAD_ACTION'});
      return json(res,result.ok?200:409,result);
    }

    if (req.method==='GET' && urlObj.pathname==='/api/state') {
      const code=String(urlObj.searchParams.get('code')||'').toUpperCase();
      const room=rooms.get(code);
      if(!room) return json(res,404,{ok:false,error:'ROOM_NOT_FOUND'});
      const player=findPlayer(
        room,
        urlObj.searchParams.get('playerId'),
        urlObj.searchParams.get('token')
      );
      if(!player) return json(res,403,{ok:false,error:'AUTH'});
      return json(res,200,{ok:true,room:roomSummary(room,player.id)});
    }

    if (req.method==='GET' && urlObj.pathname==='/events') {
      const code=String(urlObj.searchParams.get('code')||'').toUpperCase();
      const room=rooms.get(code);
      if(!room) return json(res,404,{ok:false,error:'ROOM_NOT_FOUND'});
      const player=findPlayer(
        room,
        urlObj.searchParams.get('playerId'),
        urlObj.searchParams.get('token')
      );
      if(!player) return json(res,403,{ok:false,error:'AUTH'});

      res.writeHead(200,{
        'Content-Type':'text/event-stream',
        'Cache-Control':'no-cache, no-transform',
        'Connection':'keep-alive',
        'X-Accel-Buffering':'no'
      });
      res.write(': connected\n\n');

      if(player.sse && player.sse!==res) {
        try{player.sse.end();}catch(_){}
      }
      player.sse=res;
      player.connected=true;
      touch(room);

      sendPlayer(player,'connected',{
        room:roomSummary(room,player.id)
      });
      const other=opponent(room,player);
      if(other) sendPlayer(other,'opponent-connection',{connected:true,opponent:publicPlayer(player)});

      const heartbeat=setInterval(()=>{
        try{res.write(': ping\n\n');}catch(_){}
      },15000);

      req.on('close',()=>{
        clearInterval(heartbeat);
        if(player.sse===res) player.sse=null;
        player.connected=false;
        touch(room);
        const op=opponent(room,player);
        if(op) sendPlayer(op,'opponent-connection',{connected:false,opponent:publicPlayer(player)});
      });
      return;
    }

    return serveStatic(req,res,urlObj);
  } catch (e) {
    console.error(e);
    return json(res,500,{ok:false,error:'SERVER_ERROR'});
  }
});

// Room cleanup
setInterval(()=>{
  const cutoff=now()-ROOM_TTL_MS;
  for(const [code,room] of rooms) {
    if(room.updatedAt<cutoff) {
      clearTimeout(room.questionTimer);
      clearTimeout(room.revealTimer);
      for(const p of room.players){try{if(p.sse)p.sse.end();}catch(_){}}
      rooms.delete(code);
    }
  }
},60_000).unref();

server.listen(PORT,HOST,()=>{
  console.log(`Desafio Bíblico Online rodando em http://localhost:${PORT}`);
  console.log(`Perguntas carregadas: ${QUESTIONS.length}`);
});
