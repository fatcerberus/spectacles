/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { Kami } from 'sphere-runtime';

import BattleActor from '$/battleSystem/battleActor';
import BattleHUD from '$/battleSystem/battleHUD';
import BattleScreen from '$/battleSystem/battleScreen';
import HPGauge from '$/battleSystem/hpGauge';
import MPGauge from '$/battleSystem/mpGauge';
import MoveMenu from '$/battleSystem/moveMenu';
import TargetMenu from '$/battleSystem/targetMenu';
import TurnPreview from '$/battleSystem/turnPreview';

Kami.attachClass(BattleActor);
Kami.attachClass(BattleHUD);
Kami.attachClass(BattleScreen);
Kami.attachClass(HPGauge);
Kami.attachClass(MPGauge);
Kami.attachClass(MoveMenu);
Kami.attachClass(TargetMenu);
Kami.attachClass(TurnPreview);
