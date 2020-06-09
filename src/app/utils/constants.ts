export const domainLocal = 'localhost:8817';
export const domainProd = '173.27.48.6:8171';
export const domain = domainProd;

export const URLS = {
    playerArena : 'http://' + domain + '/api/player/arena/',
    playerLogin : 'http://' + domain + '/api/player/',
    characters : 'http://' + domain + '/api/character/',

    battleSocket : 'ws://' + domain + '/arena/',
    chatSocket : 'ws://' + domain + '/chat/'
}
