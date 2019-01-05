import React, { Component } from 'react'
import styled, {createGlobalStyle} from 'styled-components'

const electron = window.require('electron')
const { ipcRenderer } = electron
const GlobalStyle = createGlobalStyle`
[data-theme^="light"],
[data-theme] [data-theme^="light"] {
  --background-color: #fff;
  --font-color: #000;
}
[data-theme^="dark"],
[data-theme] [data-theme^="dark"] {
  --background-color: rgb(58, 58, 60);
  --font-color: #fff;
}
body {
  color: var(--font-color);
}
body, #root {
  width: 300px;
  height: 250px;
}
`;
const Container = styled.div`
display: flex;
flex: 1;
flex-direction: column;
`;
const Content = styled.div`
display: flex;
flex-direction: column;
flex: 1;
padding-top: 25px;
align-items:center;
border-radius: 4px;
background-color: var(--background-color);
`
const Pointer = styled.div`
width: 0;
height: 0;
border-right: 1rem solid transparent;
border-bottom: 1rem solid var(--background-color);
border-left: 1rem solid transparent;
margin: auto;
transition: border-bottom-width .2s ease,border-bottom-color .3s ease;
background-color: transparent;
`;
const ImageContainer = styled.div`
flex: 0 0 100px;
justify-content:center;
align-items:center;
display: flex;
`
const StatsContainer = styled.div`
flex: 1 1 auto;
justify-content:center;
align-items:center;
display: flex;
flex-direction:column;
`
function getTime(date) {
  let s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) {
    return `${s}s`;
  } else if (s < 3600) {
    const m = Math.floor(s / 60);
    s = s % 60;
    return `${m}m ${s}s`
  } else {
    const h = Math.floor(s / 3600)
    const m = Math.floor(s % 3600 / 60)
    s = s % 60;
    return `${h}h ${m}m ${s}`;
  }
}
class App extends Component {
  state = {
    stats: {
      internet: 0,
      dns: 0
    }
  }
  updateStats = () => {
    this.setState({
      stats: ipcRenderer.sendSync('stats')
    })
  }
  componentDidMount () {
    this.updateStats()
    setInterval(() => { this.updateStats() }, 1000)
  }
  render () {
    const {stats} = this.state;
    const isOkay = stats.dns === 0 && stats.internet === 0;
    return (
      <>
        <GlobalStyle />
        <Container>
          {<Pointer />}
          <Content>
            <ImageContainer>
              <img style={{width: 75, height: 75}} src={isOkay ? require('./assets/ThumbsUp.png') : require('./assets/ThumbsDown.png')} />
            </ImageContainer>
            <StatsContainer>
              <div>{stats.internet === 0 ? 'Internet: 👍' : 'Internet: 👎 for'}</div>
              <div>{stats.dns === 0 ? 'DNS: 👍' : 'DNS: 👎 for ' + getTime(stats.dns)}</div>
            </StatsContainer>
          </Content>
        </Container>
      </>
    )
  }
}

export default App
