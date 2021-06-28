import { environment } from './../../environments/environment';

let host = environment.host;

export const domain = host;

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
