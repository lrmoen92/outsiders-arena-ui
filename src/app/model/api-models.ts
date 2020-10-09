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
    abilities : Array<Ability>;
}

export class CharacterInstance {
    hp : Number;
    playerOneCharacter : Boolean;
    // player 1 (1, 2, 3) player 2 (4, 5, 6)
    position : Number;
    characterId : Number;
    effects : Array<BattleEffect>;
    dead : Boolean;
    highlighted : Boolean;
}

export class AbilityTargetDTO {
    ability : Ability;
    characterPosition: Number;
    targetPositions : Array<Number>;
}

export class BattleTurnDTO {
    spentEnergy : Map<string, Number>;
    effects : Array<BattleEffect>;
    abilities : Array<AbilityTargetDTO>;
}

export class CostCheckDTO {
    chosenAbilities : Array<AbilityTargetDTO>;
    alliedAbilities : Array<Ability>
}

export class Ability {
    cooldown : Number;
    name : string;
    abilityUrl : string;
    description : string;
    cleanCost : string;
    targets : string;
    types : string;
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
    avatarUrl : string;

    name : string;
    condition : string;
    quality : string;
    description : string;
    interruptable : Boolean;
    physical : Boolean;
    magical : Boolean;
    affliction : Boolean;
    conditional : Boolean;
    visible : Boolean;
    stacks : Boolean;
    statMods : Map<string, Number>;
}

export class BattleEffect extends Effect {
      // used to identify an effect within the context of a battle (backend assigned)
      instanceId : Number;
      // used to identify an effect within the context of a battle (backend assigned)
      groupId : Number;
      // only for effects on character instances (should be position based)
      originCharacter : Number;
      targetCharacter : Number;
}

export class Battle {
    id : Number;
    playerOneStart : Boolean;
    status : string;
    turn : Number;
    arenaId : Number;
    playerIdOne : Number;
    playerIdTwo : Number;
    playerOneTeam : Array<CharacterInstance>;
    playerTwoTeam : Array<CharacterInstance>;
    playerOneEnergy : Map<string, Number>;
    playerTwoEnergy : Map<string, Number>;
}

