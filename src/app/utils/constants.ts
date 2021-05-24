import { environment } from './../../environments/environment';

let prod = environment.production;

export const domainLocal = 'localhost:8817';
// export const domainProd = '192.168.0.34:8171';
export const domainProd = '192.168.0.70:8171';
export const domain = prod ? domainProd : domainLocal;

export const serverPrefix = "";

export const URLS = {
    playerLadderArena : 'http://' + domain + '/api/player/arena/ladder/',
    playerQuickArena : 'http://' + domain + '/api/player/arena/quick/',
    playerArena : 'http://' + domain + '/api/player/arena/',
    playerLogin : 'http://' + domain + '/api/player/login/',
    playerSignup : 'http://' + domain + '/api/player/signup/',
    arenaOrphan :  'http://' + domain + '/api/player/arena/orphan/',
    characters : 'http://' + domain + '/api/character/',
    missions : 'http://' + domain + '/api/mission/',

    battleSocket : 'ws://' + domain + '/arena/',
    chatSocket : 'ws://' + domain + '/chat/'
}
