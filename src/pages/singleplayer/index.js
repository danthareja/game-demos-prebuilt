/*
 * Copyright 2017 The boardgame.io Authors.
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import Async from 'react-promise';
import React from 'react';
import { render } from 'react-dom';

import bindingsPromise from '../../../core/client/';
import createProxyBuilder from 'oasis-game-client-proxy';
import { Client } from 'oasis-game-components';

import Board from '../../components/board';
import Logo from '../../assets/logo.svg';

window.bindingsPromise = bindingsPromise;

class PlayerWrapper extends React.Component {
  constructor(props) {
    super(props)
    this.state = { currentPlayer: null }

    const self = this
    this.props.proxy.subscribe(function () { self._updatePlayer() })
  }

  _updatePlayer () {
    let state = this.props.proxy._store.get_state()[1]
    // TODO: this will not work with action_players
    this.setState({ currentPlayer: state.ctx.current_player })
  }

  _getDisplay (playerId) {
    if (playerId === this.state.currentPlayer) return ''
    return 'none'
  }

  componentDidMount () {
    this._updatePlayer()
  }

  render () {
    const style1 = { display: this._getDisplay(1) }
    const style2 = { display: this._getDisplay(2) }
    return (
      <div>
        <div style={style1}>
          <this.props.playerOne />
        </div>
        <div style={style2}>
          <this.props.playerTwo />
        </div>
      </div>
    )
  }
}

const Singleplayer = () => {
  let proxiesPromise = async (resolve, reject) => {
    let bindings = await bindingsPromise;
    let proxyBuilder = createProxyBuilder(bindings);
    let seed = Math.floor(Math.random() * 100000);
    return Promise.all([
      proxyBuilder([1,2], null, 1, seed).ready(),
      proxyBuilder([1,2], null, 2, seed).ready()
    ]);
  }

  return (
    <Async promise={proxiesPromise()} then={([proxy1, proxy2]) => {
      // This simplifies local testing.
      let tee = (function (d1, d2) {
        return (action) => {
          d1(action);
          d2(action);
        }
      })(proxy1.dispatch.bind(proxy1), proxy2.dispatch.bind(proxy2));

      proxy1.dispatch = tee;
      proxy2.dispatch = tee;

      let PlayerOne = Client({
        board: Board,
        proxy: proxy1,
        playerId: 1,
        players: [1, 2],
        multiplayer: null,
        debug: true
      });

      let PlayerTwo = Client({
        board: Board,
        proxy: proxy2,
        playerId: 2,
        players: [1, 2],
        multiplayer: null,
        debug: true
      });

      console.log('rendering')
      return (
        <div className="code flex flex-column w-100 h-100 items-center bg-light-gray">
          <h1 className="f1 lh-title mb1">Battleship</h1>
          <div className="flex justify-center">
            <h4 className="pt0 mt3 mr2">with</h4>
            <img className="h2" src={Logo} />
          </div>
          <PlayerWrapper proxy={proxy1} playerOne={PlayerOne} playerTwo={PlayerTwo} />
        </div>
      );
    }} />
  );
}

render(
    <Singleplayer />,
    document.getElementById('app')
);
