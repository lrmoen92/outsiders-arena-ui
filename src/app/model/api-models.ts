export class Player {
    id : Number;
    avatarUrl : string;
    displayName : string;
    level : Number;
}

export class Character {
    id : Number;
    avatarUrl : string;
    name : string;
    slot1 : Ability;
    slot2 : Ability;
    slot3 : Ability;
    slot4 : Ability;
    slota : Ability;
    slotb : Ability;
    slotc : Ability;
    slotd : Ability;
}

export class CharacterInstance {
    hp : Number;
    playerOneCharacter : Boolean;
    // player 1 (1, 2, 3) player 2 (4, 5, 6)
    location : Number;
    characterId : Number;
    effects : Array<Effect>;
    dead : Boolean;
    highlighted : Boolean;
}

export class Ability {
    cooldown : Number;
    name : string;
    abilityUrl : string;
    description : string;
    cost : Array<string>;
    selfEffects : Array<Effect>;
    enemyEffects : Array<Effect>;
    aoeEnemyEffects : Array<Effect>;
    allyEffects : Array<Effect>;
    aoeAllyEffects : Array<Effect>;
    aoe : Boolean;
    self : Boolean;
    ally : Boolean;
    enemy : Boolean;
}

export class Effect {
    duration : Number;
    name : string;
    condition : string;
    quality : string;
    description : string;
    // only for effects on character instances (should be position based)
    originCharacter : Number;
    targetCharacter : Number;
    interruptable : Boolean;
    physical : Boolean;
    magical : Boolean;
    conditional : Boolean;
    visible : Boolean;
    statMods : Map<string, Number>;
}

export class Battle {
    id : Number;
    playerOneStart;
    status : string;
    turn : Number;
    arenaId : Number;
    playerIdOne : Number;
    playerIdTwo : Number;
    playerOneTeam : Array<CharacterInstance>;
    playerTwoTeam : Array<CharacterInstance>;
    playerOneEnergy : Array<string>;
    playerTwoEnergy : Array<string>;
}

