export const domainLocal = 'localhost:8817';
export const domainProd = '66.242.90.163:8171';
export const domain = domainLocal;

export const URLS = {
    playerArena : 'http://' + domain + '/api/player/arena/',
    playerLogin : 'http://' + domain + '/api/player/',
    characters : 'http://' + domain + '/api/character/',

    battleSocket : 'ws://' + domain + '/arena/',
    chatSocket : 'ws://' + domain + '/chat/'
}
