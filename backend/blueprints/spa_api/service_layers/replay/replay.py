from typing import List, cast

from flask import current_app

from backend.database.objects import Game, PlayerGame, Tag
from backend.database.wrapper.tag_wrapper import TagWrapper
from .replay_player import ReplayPlayer
from ..utils import sort_player_games_by_team_then_id
from ...errors.errors import ReplayNotFound


class GameScore:
    def __init__(self, team_0_score: int, team_1_score: int):
        self.team0Score = team_0_score
        self.team1Score = team_1_score

    @staticmethod
    def create_from_game(game: Game):
        return GameScore(game.team0score, game.team1score)


class GameTag:
    def __init__(self, name: str, owner: str):
        self.name = name
        self.ownerId = owner

    @staticmethod
    def create_from_tag(tag: Tag):
        return GameTag(tag.name, tag.owner)


class Replay:
    def __init__(self, id_: str, name: str, date: str,
                 game_mode: str, game_score: GameScore,
                 players: List[ReplayPlayer], tags: List[GameTag]):
        self.id = id_
        self.name = name
        self.date = date
        self.gameMode = game_mode
        self.gameScore = game_score.__dict__
        self.players = [player.__dict__ for player in players]
        self.tags = [tag.__dict__ for tag in tags]

    @staticmethod
    def create_from_id(id_: str) -> 'Replay':
        session = current_app.config['db']()
        game = session.query(Game).filter(Game.hash == id_).first()
        if game is None:
            raise ReplayNotFound()
        replay = Replay.create_from_game(game)
        session.close()
        return replay

    @staticmethod
    def create_from_game(game: Game) -> 'Replay':
        return Replay(
            id_=game.hash,
            name=game.name,
            date=game.match_date.isoformat(),
            game_mode=f"{game.teamsize}'s",
            game_score=GameScore.create_from_game(game),
            players=[
                ReplayPlayer.create_from_player_game(player_game)
                for player_game in sort_player_games_by_team_then_id(
                    cast(List[PlayerGame], game.playergames))
            ],
            tags=[
                GameTag.create_from_tag(tag)
                for tag in game.tags
            ]
        )

    def add_tag(self, user_id, tag_name):
        tag = TagWrapper.add_tag_to_game(self.id, user_id, tag_name)
        self.tags.append(GameTag.create_from_tag(tag).__dict__)

    def remove_tag(self, user_id, tag_name):
        tag = TagWrapper.remove_tag_from_game(self.id, user_id, tag_name)
        if tag is not None:
            self.tags.remove(GameTag.create_from_tag(tag).__dict__)
