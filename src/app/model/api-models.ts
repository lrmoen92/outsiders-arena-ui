export class Player {
    id : number;
    avatarUrl : string;
    displayName : string;
    level : number;
    credentials : PlayerCredentials;
    xp : number;
    missionIdsCompleted : Array<number>;
    characterIdsUnlocked : Array<number>;
    missionProgress : Array<MissionProgress>;
}

export class MissionRequirement {
    amount : number;
	
	missionId : number;
	
	userFaction : string;
	targetFaction : string;
}

export class PlayerEnergy {
    type : string;
    amount : number;
    spent : number;
    total : number;
}

export class Mission {
    id : number;
	name : string;
	description : string;
	avatarUrl : string;
	minmumLevel : number;
	prerequisiteMissionId : number;
	characterIdUnlocked : number;
	requirements : Array<MissionRequirement>;
}

export class MissionProgress {
    requirements : Array<MissionRequirement>;
}

export class PlayerCredentials {
    email : string;
    password : string;
}

export class Character {
    id : number;
    avatarUrl : string;
    name : string;
    abilities : Array<Ability>;
}

export class CharacterInstance {
    hp : number;
    // player 1 (1, 2, 3) player 2 (4, 5, 6)
    position : number;
    characterId : number;
    effects : Array<BattleEffect>;
    dead : Boolean;
    highlighted : Boolean;
}

export class AbilityTargetDTO {
    ability : Ability;
    characterPosition: number;
    targetPositions : Array<number>;
}

export class BattleTurnDTO {
    spentEnergy : any;
    effects : Array<BattleEffect>;
    abilities : Array<AbilityTargetDTO>;
}

export class CostCheckDTO {
    chosenAbilities : Array<AbilityTargetDTO>;
    allyCosts : Array<Ability>;
    spentEnergy : Array<string>;
}

export class Portrait {
    style : any;
    url : string;
}

export class Ability {
    cooldown : number;
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
    duration : number;
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
    statMods : Map<string, number>;
}

export class BattleEffect extends Effect {
      // used to identify an effect within the context of a battle (backend assigned)
      instanceId : number;
      // used to identify an effect within the context of a battle (backend assigned)
      groupId : number;
      // only for effects on character instances (should be position based)
      originCharacter : number;
      targetCharacter : number;
}

export class Battle {
    id : number;
    playerOneStart : boolean;
    status : string;
    turn : number;
    arenaId : number;
    playerIdOne : number;
    playerIdTwo : number;
    playerOneTeam : Array<CharacterInstance>;
    playerTwoTeam : Array<CharacterInstance>;
    playerOneEnergy : Map<string, number>;
    playerTwoEnergy : Map<string, number>;
}

export class GameEnd {
    victory: boolean;
    progressString: string;
    player: Player;
}

