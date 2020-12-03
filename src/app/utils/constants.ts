let prod = false;

export const domainLocal = 'localhost:8817';
// export const domainProd = '192.168.0.34:8171';
export const domainProd = '65.128.170.108:8171';
export const domain = prod ? domainProd : domainLocal;

export const serverPrefix = prod ? "/outsiders-arena-ui/" : "";

export const URLS = {
    playerLadderArena : 'http://' + domain + '/api/player/arena/ladder/',
    playerQuickArena : 'http://' + domain + '/api/player/arena/quick/',
    playerArena : 'http://' + domain + '/api/player/arena/',
    playerLogin : 'http://' + domain + '/api/player/login/',
    playerSignup : 'http://' + domain + '/api/player/signup/',
    characters : 'http://' + domain + '/api/character/',

    battleSocket : 'ws://' + domain + '/arena/',
    chatSocket : 'ws://' + domain + '/chat/'
}
