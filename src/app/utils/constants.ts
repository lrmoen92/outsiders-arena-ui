let prod = false;

export const domainLocal = 'localhost:8817';
export const domainProd = '173.27.48.6:8171';
export const domain = prod ? domainProd : domainLocal ;

export const serverPrefix = prod ? "/outsiders-arena-ui" : "";

export const URLS = {
    playerLadderArena : 'http://' + domain + '/api/player/arena/ladder/',
    playerQuickArena : 'http://' + domain + '/api/player/arena/quick/',
    playerArena : 'http://' + domain + '/api/player/arena/',
    playerLogin : 'http://' + domain + '/api/player/',
    characters : 'http://' + domain + '/api/character/',

    battleSocket : 'ws://' + domain + '/arena/',
    chatSocket : 'ws://' + domain + '/chat/'
}
