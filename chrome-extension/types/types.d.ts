interface Game {
  gameId: string;
  gameCode: string;
  gameStatus: number;
  gameStatusText: string;
  period: number;
  gameClock: string;
  gameTimeUTC: string;
  gameEt: string;
  regulationPeriods: number;
  ifNecessary: boolean;
  seriesGameNumber: string;
  seriesText: string;
  seriesConference: string;
  poRoundDesc: string;
  gameSubtype: string;
  homeTeam: Team;
  awayTeam: Team;
  gameLeaders: GameLeaders;
  pbOdds: {
    team: null;
    odds: number;
    suspended: number;
  };
}

interface Team {
  teamId: number;
  teamName: string;
  teamCity: string;
  teamTricode: string;
  wins: number;
  losses: number;
  score: number;
  seed: null;
  inBonus: null;
  timeoutsRemaining: number;
  periods: Period[];
}

interface Period {
  period: number;
  periodType: string;
  score: number;
}

interface GameLeaders {
  homeLeaders: PlayerStats;
  awayLeaders: PlayerStats;
}

interface PlayerStats {
  personId: number;
  name: string;
  jerseyNum: string;
  position: string;
  teamTricode: string;
  playerSlug: null;
  points: number;
  rebounds: number;
  assists: number;
}

interface Interval {
  time: string;
  scoreDiff: number;
  overtime?: number;
}
