/* react native does not support dynamic requires, so  I have to write down all requires for card images. https://stackoverflow.com/questions/44991669/react-native-require-with-dynamic-string*/

const imgPath = '../assets/img';

export default {
  avatars: {
    'who': require(`${imgPath}/ui/avatars/who.png`),
    'goblin': require(`${imgPath}/ui/avatars/goblin.png`),
    'man': require(`${imgPath}/ui/avatars/man.png`),
    'nord': require(`${imgPath}/ui/avatars/nord.png`),
    'woman': require(`${imgPath}/ui/avatars/woman.png`),
    'sage': require(`${imgPath}/ui/avatars/sage.png`),
  },
  cardCovers: {
    'classic': require(`${imgPath}/ui/card-covers/classic.png`),
    'steampunk': require(`${imgPath}/ui/card-covers/steampunk.png`)
  },
  cards: { // this was hell to write
    'Minion Bot': require(`${imgPath}/ui/cards/machineMinionBot.jpg`), 
    'Spring Bot': require(`${imgPath}/ui/cards/machineSpringBot.jpg`), 
    'Rapid Bot': require(`${imgPath}/ui/cards/machineRapidBot.jpg`), 
    'Clysm Bot': require(`${imgPath}/ui/cards/6.jpg`), 
    'Aluminum Bot': require(`${imgPath}/ui/cards/8.jpg`), 
    'Companion Bot': require(`${imgPath}/ui/cards/machineCompanionBot.jpg`), 
    'Power Bot': require(`${imgPath}/ui/cards/machinePowerBot.jpg`), 
    'Golem Bot': require(`${imgPath}/ui/cards/machineGolemBot.jpg`), 
    'Reactor Bot': require(`${imgPath}/ui/cards/machineReactorBot.jpg`), 
    'Tiny Bot': require(`${imgPath}/ui/cards/machineScapegoatBot.jpg`), 
    'Buildup Bot': require(`${imgPath}/ui/cards/machineBuildupBot.jpg`), 
    'Explosive Bot': require(`${imgPath}/ui/cards/machineExplosiveBot.jpg`), 
    'Companion Bot v2': require(`${imgPath}/ui/cards/selfOptimizer.png`), 
    'Reanimated Artifact': require(`${imgPath}/ui/cards/mechaBones.png`), 
    'Campfire': require(`${imgPath}/ui/cards/discoveryCampfire.jpg`), 
    'Energy Relic': require(`${imgPath}/ui/cards/discoveryEnergyRelic.jpg`), 
    'Recover': require(`${imgPath}/ui/cards/discoveryRecover.jpg`), 
    'Amnesia': require(`${imgPath}/ui/cards/discoveryAmnesia.jpg`), 
    'Clockwork': require(`${imgPath}/ui/cards/discoveryUnlock.jpg`), 
    'Unsummon': require(`${imgPath}/ui/cards/discoveryUnsummon.jpg`), 
    'Extinction': require(`${imgPath}/ui/cards/discoveryExtinction.jpg`), 
    'Spark Explosion': require(`${imgPath}/ui/cards/discoverySparkExplosion.jpg`), 
    'Controlled Explosion': require(`${imgPath}/ui/cards/discoveryControlledExplosion.jpg`), 
    'BlastingExplosion': require(`${imgPath}/ui/cards/discoveryBlastingExplosion.jpg`), 
    'Enchant': require(`${imgPath}/ui/cards/discoveryEnchant.jpg`), 
    'ReFormation': require(`${imgPath}/ui/cards/discoveryReFormation.jpg`), 
    'Effervescence': require(`${imgPath}/ui/cards/discoveryEffervescence.jpg`), 
    'Berries': require(`${imgPath}/ui/cards/discoveryBerries.jpg`), 
    'kindle': require(`${imgPath}/ui/cards/discoveryKindle.jpg`), 
    'Blackout': require(`${imgPath}/ui/cards/discoveryBlackout.jpg`), 
    'Energy Justice': require(`${imgPath}/ui/cards/discoveryJustice.jpg`), 
    'Blacksmith': require(`${imgPath}/ui/cards/discoverySmith.jpg`), 
    'Exploration': require(`${imgPath}/ui/cards/discoveryExploration.jpg`), 
    'Momentum': require(`${imgPath}/ui/cards/discoveryMomentum.jpg`), 
    'Shiruken': require(`${imgPath}/ui/cards/discoveryShiruken.jpg`), 
    'Outrage': require(`${imgPath}/ui/cards/discoveryOutrage.jpg`), 
    'Intelligence': require(`${imgPath}/ui/cards/discoveryIntelligence.jpg`), 
    'Fracture': require(`${imgPath}/ui/cards/discoveryFracture.jpg`), 
    'Intimidation': require(`${imgPath}/ui/cards/discoveryIntimidation.jpg`), 
    'Overclock': require(`${imgPath}/ui/cards/discoveryOverclock.jpg`), 
    'Runes': require(`${imgPath}/ui/cards/discoveryRunes.jpg`), 
    'Infeccion': require(`${imgPath}/ui/cards/discoveryInfeccion.jpg`), 
    'Quick Slash': require(`${imgPath}/ui/cards/discoveryQuickSlash.jpg`), 
    'Astronomy': require(`${imgPath}/ui/cards/discoveryAstronomy.jpg`), 
    'Massacre': require(`${imgPath}/ui/cards/discoveryMassacre.jpg`), 
    'Resource Extinction': require(`${imgPath}/ui/cards/discoveryResourceExtinction.jpg`), 
    'Wartime': require(`${imgPath}/ui/cards/discoveryWartime.jpg`), 
    'Tidal Momentum': require(`${imgPath}/ui/cards/discoveryTidal.jpg`), 
    'EEruption': require(`${imgPath}/ui/cards/discoveryEruption.jpg`), 
    'DivineRecovery': require(`${imgPath}/ui/cards/discoveryDivineRestoration.jpg`), 
    'Undiscovered Glyph': require(`${imgPath}/ui/cards/discoveryGlyph.jpg`), 
    'Familiarity': require(`${imgPath}/ui/cards/discoveryFamiliarity.jpg`), 
    'Plague': require(`${imgPath}/ui/cards/discoveryPlague.jpg`), 
    'Realization': require(`${imgPath}/ui/cards/discoveryRealization.jpg`), 
    'Famine': require(`${imgPath}/ui/cards/discoveryFamine.jpg`),
    'Gear Relic': require(`${imgPath}/ui/cards/gearRelic.png`),
    'Gear Justice': require(`${imgPath}/ui/cards/gearJustice.png`)
  }
}