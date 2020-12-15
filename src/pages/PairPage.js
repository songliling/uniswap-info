import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router-dom'
import 'feather-icons'
import styled from 'styled-components'
import Panel from '../components/Panel'
import { PageWrapper, ContentWrapperLarge, StyledIcon } from '../components/index'
import { AutoRow, RowBetween, RowFixed } from '../components/Row'
import Column, { AutoColumn } from '../components/Column'
import { ButtonLight, ButtonDark } from '../components/ButtonStyled'
import PairChart from '../components/PairChart'
import Link from '../components/Link'
import TxnList from '../components/TxnList'
import Loader from '../components/LocalLoader'
import { BasicLink } from '../components/Link'
import Search from '../components/Search'
import { formattedNum, formattedPercent, getPoolLink, getSwapLink } from '../utils'
import { useColor } from '../hooks'
import { usePairData, usePairTransactions } from '../contexts/PairData'
import { TYPE, ThemedBackground } from '../Theme'
import { transparentize } from 'polished'
import CopyHelper from '../components/Copy'
import { useMedia } from 'react-use'
import DoubleTokenLogo from '../components/DoubleLogo'
import TokenLogo from '../components/TokenLogo'
import { Hover } from '../components'
import { useEthPrice } from '../contexts/GlobalData'
import Warning from '../components/Warning'
import { usePathDismissed, useSavedPairs } from '../contexts/LocalStorage'

import { Bookmark, PlusCircle } from 'react-feather'
import FormattedName from '../components/FormattedName'
import { useListedTokens } from '../contexts/Application'

import { Token, Fetcher, Trade, Route, TokenAmount, TradeType, Percent, Fraction } from '@uniswap/sdk'
import JSBI from 'jsbi'
import ReactLoading from 'react-loading'
import { Modal } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css';
import { default as ReactSelect } from 'react-select'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DashboardWrapper = styled.div`
  width: 100%;
`

const PanelWrapper = styled.div`
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: max-content;
  gap: 6px;
  display: inline-grid;
  width: 100%;
  align-items: start;
  @media screen and (max-width: 1024px) {
    grid-template-columns: 1fr;
    align-items: stretch;
    > * {
      grid-column: 1 / 4;
    }

    > * {
      &:first-child {
        width: 100%;
      }
    }
  }
`

const TokenDetailsLayout = styled.div`
  display: inline-grid;
  width: 100%;
  grid-template-columns: auto auto auto auto 1fr;
  column-gap: 60px;
  align-items: start;

  &:last-child {
    align-items: center;
    justify-items: end;
  }
  @media screen and (max-width: 1024px) {
    grid-template-columns: 1fr;
    align-items: stretch;
    > * {
      grid-column: 1 / 4;
      margin-bottom: 1rem;
    }

    &:last-child {
      align-items: start;
      justify-items: start;
    }
  }
`

const FixedPanel = styled(Panel)`
  width: fit-content;
  padding: 8px 12px;
  border-radius: 10px;

  :hover {
    cursor: pointer;
    background-color: ${({ theme }) => theme.bg2};
  }
`

const HoverSpan = styled.span`
  :hover {
    cursor: pointer;
    opacity: 0.7;
  }
`

const WarningGrouping = styled.div`
  opacity: ${({ disabled }) => disabled && '0.4'};
  pointer-events: ${({ disabled }) => disabled && 'none'};
`

const Input = styled.input`
  position: relative;
  display: flex;
  align-items: center;
  width: 60%;
  white-space: nowrap;
  background: none;
  border: none;
  outline: none;
  padding: 12px 16px;
  border-radius: 12px;
  color: ${({ theme }) => theme.text1};
  background-color: ${({ theme }) => theme.bg1};
  font-size: 16px;
  margin-right: 1rem;
  border: 1px solid ${({ theme }) => theme.bg3};

  ::placeholder {
    color: ${({ theme }) => theme.text3};
    font-size: 14px;
  }

  @media screen and (max-width: 640px) {
    ::placeholder {
      font-size: 1rem;
    }
  }
`

const colourStyles = {
  control: styles => ({ ...styles, color: 'blue', backgroundColor: '#1f2026' }),
  option: (styles, { data, isDisabled, isFocused, isSelected }) => {
    return {
      ...styles,
      backgroundColor: '#1f2026',
      color: '#FAFAFA',
      fontWeight: 500,
    }
  },
  singleValue: (provided) => {
    return {
      ...provided,
      color: '#FAFAFA',
      fontWeight: 500,
    }
  },
}

function PairPage({ pairAddress, history }) {
  const {
    token0,
    token1,
    reserve0,
    reserve1,
    reserveUSD,
    trackedReserveUSD,
    oneDayVolumeUSD,
    volumeChangeUSD,
    oneDayVolumeUntracked,
    volumeChangeUntracked,
    liquidityChangeUSD,
  } = usePairData(pairAddress)

  useEffect(() => {
    document.querySelector('body').scrollTo(0, 0)
  }, [])

  const transactions = usePairTransactions(pairAddress)
  const backgroundColor = useColor(pairAddress)

  // liquidity
  const liquidity = trackedReserveUSD
    ? formattedNum(trackedReserveUSD, true)
    : reserveUSD
    ? formattedNum(reserveUSD, true)
    : '-'
  const liquidityChange = formattedPercent(liquidityChangeUSD)

  // mark if using untracked liquidity
  const [usingTracked, setUsingTracked] = useState(true)
  useEffect(() => {
    setUsingTracked(!trackedReserveUSD ? false : true)
  }, [trackedReserveUSD])

  // volume	  // volume
  const volume =
    oneDayVolumeUSD || oneDayVolumeUSD === 0
      ? formattedNum(oneDayVolumeUSD === 0 ? oneDayVolumeUntracked : oneDayVolumeUSD, true)
      : oneDayVolumeUSD === 0
      ? '$0'
      : '-'

  // mark if using untracked volume
  const [usingUtVolume, setUsingUtVolume] = useState(false)
  useEffect(() => {
    setUsingUtVolume(oneDayVolumeUSD === 0 ? true : false)
  }, [oneDayVolumeUSD])

  const volumeChange = formattedPercent(!usingUtVolume ? volumeChangeUSD : volumeChangeUntracked)

  // get fees	  // get fees
  const fees =
    oneDayVolumeUSD || oneDayVolumeUSD === 0
      ? usingUtVolume
        ? formattedNum(oneDayVolumeUntracked * 0.003, true)
        : formattedNum(oneDayVolumeUSD * 0.003, true)
      : '-'

  // token data for usd
  const [ethPrice] = useEthPrice()
  const token0USD =
    token0?.derivedETH && ethPrice ? formattedNum(parseFloat(token0.derivedETH) * parseFloat(ethPrice), true) : ''

  const token1USD =
    token1?.derivedETH && ethPrice ? formattedNum(parseFloat(token1.derivedETH) * parseFloat(ethPrice), true) : ''

  // rates
  const token0Rate = reserve0 && reserve1 ? formattedNum(reserve1 / reserve0) : '-'
  const token1Rate = reserve0 && reserve1 ? formattedNum(reserve0 / reserve1) : '-'

  // formatted symbols for overflow
  const formattedSymbol0 = token0?.symbol.length > 6 ? token0?.symbol.slice(0, 5) + '...' : token0?.symbol
  const formattedSymbol1 = token1?.symbol.length > 6 ? token1?.symbol.slice(0, 5) + '...' : token1?.symbol

  const below1080 = useMedia('(max-width: 1080px)')
  const below900 = useMedia('(max-width: 900px)')
  const below600 = useMedia('(max-width: 600px)')

  const [dismissed, markAsDismissed] = usePathDismissed(history.location.pathname)

  const TOKEN0 = React.Component.prototype.TOKEN0
  const TOKEN1 = React.Component.prototype.TOKEN1
  const Token0 = new Token(TOKEN0.chainId, TOKEN0.address, TOKEN0.decimals, TOKEN0.symbol)
  const Token1 = new Token(TOKEN1.chainId, TOKEN1.address, TOKEN1.decimals, TOKEN1.symbol)

  useEffect(() => {
    window.scrollTo({
      behavior: 'smooth',
      top: 0,
    })
  }, [])

  const [savedPairs, addPair] = useSavedPairs()

  const listedTokens = useListedTokens()

  const [r0, setR0] = useState()

  const [impact, setImpact] = useState()

  const [trade, setTrade] = useState()

  const [showloading, setShowLoading] = useState(false)

  const [showResult, setShowResult] = useState(false)

  const [currentToken, setCurrentToken] = useState(Token0)

  const Regex = /^[0-9]+([.]{1}[0-9]+){0,1}$/

  const MAX_IMPACT = 15
  const MIN_IMPACT = 0.01

  const BASE_NUMBER = 1000000000000000000

  // setCurrentToken(Token0)

  function validateInput() {
    let reserve
    if (currentToken.symbol === token0.symbol) {
      reserve = reserve0
    } else {
      reserve = reserve1
    }
    if (Number(r0) >= reserve) {
      toast.error(`input ${currentToken.symbol} must < ${reserve}`)
    }
    return Number(r0) < reserve
  }

  async function handleSwapInfo() {
    if (!((r0 && Regex.test(r0)) && (Regex.test(impact)))) {
      toast.error('invalid input')
      return
    }
    // validateInput()
    const validInput = (validateInput() && r0)
    const validImpact = (Number(impact) <= MAX_IMPACT && Number(impact) > MIN_IMPACT)
    if (!validInput) {
      return
    }
    if (!validImpact) {
      toast.error(`input impact must between ${MIN_IMPACT} and ${MAX_IMPACT}`)
      return
    }

    setShowLoading(true)
    const pair = await Fetcher.fetchPairData(Token1, Token0)
    const route = new Route([pair], currentToken)


    const r0JSBI = new Fraction(JSBI.BigInt(Number(r0) * BASE_NUMBER), JSBI.BigInt(BASE_NUMBER))
    const trade = new Trade(route, new TokenAmount(currentToken, r0JSBI.multiply(JSBI.BigInt(BASE_NUMBER)).toFixed(0)), TradeType.EXACT_INPUT)

    setTrade(trade)

    setShowLoading(false)

    setShowResult(true)
  }

  function formatNumber(r) {
    return new Fraction(JSBI.BigInt(Number(r) * BASE_NUMBER), JSBI.BigInt(BASE_NUMBER))
  }

  function show() {
    const perInputImpact = Regex.test(impact) ? new Percent(JSBI.BigInt(Number(impact) * 1000000), JSBI.BigInt(100000000)) : 1
    const realImpactWithoutFeeFraction = trade ? trade.priceImpact.subtract(new Percent(JSBI.BigInt(30), JSBI.BigInt(10000))) : 1
    const realImpactWithoutFeePercent = realImpactWithoutFeeFraction ? new Percent(realImpactWithoutFeeFraction.numerator, realImpactWithoutFeeFraction.denominator) : 1
    const title = realImpactWithoutFeePercent?.greaterThan(perInputImpact) ? 'Error' : 'Success'
    let addR0
    let addR1
    if (realImpactWithoutFeePercent?.greaterThan(perInputImpact)) {
      let ONE_HUNDRED_PERCENT = new Percent(JSBI.BigInt(10000), JSBI.BigInt(10000))
      let x = currentToken.symbol === token0.symbol ? reserve0 : reserve1
      let r0r1 = currentToken.symbol === token0.symbol ? token1Rate : token0Rate
      // k * 滑点 * x * result = x * k * x * (1 - 滑点)
      // result = x * (1 - 滑点) / 滑点
      addR0 = formatNumber(r0).multiply(ONE_HUNDRED_PERCENT.subtract(perInputImpact)).divide(perInputImpact).subtract(formatNumber(x))
      addR1 = addR0.divide(formatNumber(r0r1))
    }
    return (
      <Modal show={showResult} style={{zIndex: '9999'}} onHide={() => setShowResult(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <p>输入{trade?.inputAmount.toSignificant(6)} {currentToken.symbol}</p>
            <p>输出{trade?.outputAmount.toSignificant(6)} {currentToken.symbol === Token0.symbol ? Token1.symbol : Token0.symbol}</p>
          </div>
          {
            title === 'Success' ?
              <div>
                <p>当前滑点 {realImpactWithoutFeePercent.toFixed(2)}% 小于 {perInputImpact.toFixed(2)}%</p>
              </div> :
              <div>
                <p>当前滑点{realImpactWithoutFeePercent?.toFixed(2)}% 大于 {perInputImpact.toFixed(2)}%</p>
                <p>至少需要注入{addR0.toFixed(6)} {currentToken.symbol}</p>
                <p>至少需要注入{addR1.toFixed(6)} {currentToken.symbol === Token0.symbol ? Token1.symbol : Token0.symbol}</p>
              </div>
          }
        </Modal.Body>
      </Modal>
    )
  }

  return (
    <PageWrapper>
      <ToastContainer
        autoClose={2000}
        hideProgressBar
        closeOnClick
      />
      {showResult && show()}
      <ThemedBackground backgroundColor={transparentize(0.6, backgroundColor)} />
      <span />
      <Warning
        type={'pair'}
        show={!dismissed && listedTokens && !(listedTokens.includes(token0?.id) && listedTokens.includes(token1?.id))}
        setShow={markAsDismissed}
        address={pairAddress}
      />
      <ContentWrapperLarge>
        <RowBetween>
          <TYPE.body>
            <BasicLink to="/pairs">{'Pairs '}</BasicLink>→ {token0?.symbol}-{token1?.symbol}
          </TYPE.body>
          {!below600 && <Search small={true} />}
        </RowBetween>
        <WarningGrouping
          disabled={
            !dismissed && listedTokens && !(listedTokens.includes(token0?.id) && listedTokens.includes(token1?.id))
          }
        >
          <DashboardWrapper>
            <AutoColumn gap="40px" style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  width: '100%',
                }}
              >
                <RowFixed style={{ flexWrap: 'wrap', minWidth: '100px' }}>
                  <RowFixed>
                    {token0 && token1 && (
                      <DoubleTokenLogo a0={token0?.id || ''} a1={token1?.id || ''} size={32} margin={true} />
                    )}{' '}
                    <TYPE.main fontSize={below1080 ? '1.5rem' : '2rem'} style={{ margin: '0 1rem' }}>
                      {token0 && token1 ? (
                        <>
                          <HoverSpan onClick={() => history.push(`/token/${token0?.id}`)}>{token0.symbol}</HoverSpan>
                          <span>-</span>
                          <HoverSpan onClick={() => history.push(`/token/${token1?.id}`)}>
                            {token1.symbol}
                          </HoverSpan>{' '}
                          Pair
                        </>
                      ) : (
                        ''
                      )}
                    </TYPE.main>
                  </RowFixed>
                </RowFixed>
                <RowFixed
                  ml={below900 ? '0' : '2.5rem'}
                  mt={below1080 && '1rem'}
                  style={{
                    flexDirection: below1080 ? 'row-reverse' : 'initial',
                  }}
                >
                  {!!!savedPairs[pairAddress] && !below1080 ? (
                    <Hover onClick={() => addPair(pairAddress, token0.id, token1.id, token0.symbol, token1.symbol)}>
                      <StyledIcon>
                        <PlusCircle style={{ marginRight: '0.5rem' }} />
                      </StyledIcon>
                    </Hover>
                  ) : !below1080 ? (
                    <StyledIcon>
                      <Bookmark style={{ marginRight: '0.5rem', opacity: 0.4 }} />
                    </StyledIcon>
                  ) : (
                    <></>
                  )}

                  <Link external href={process.env.REACT_APP_TRANSGO_ADD_LIQUIDITY_URI}>
                    <ButtonLight color={backgroundColor}>+ Add Liquidity</ButtonLight>
                  </Link>
                  <Link external href={process.env.REACT_APP_TRANSGO_SWAP_URI}>
                    <ButtonDark ml={!below1080 && '.5rem'} mr={below1080 && '.5rem'} color={backgroundColor}>
                      Trade
                    </ButtonDark>
                  </Link>
                </RowFixed>
              </div>
            </AutoColumn>
            <AutoRow
              gap="6px"
              style={{
                width: 'fit-content',
                marginTop: below900 ? '1rem' : '0',
                marginBottom: below900 ? '0' : '2rem',
                flexWrap: 'wrap',
              }}
            >
              <FixedPanel onClick={() => history.push(`/token/${token0?.id}`)}>
                <RowFixed>
                  <TokenLogo address={token0?.id} size={'16px'} />
                  <TYPE.main fontSize={'16px'} lineHeight={1} fontWeight={500} ml={'4px'}>
                    {token0 && token1
                      ? `1 ${formattedSymbol0} = ${token0Rate} ${formattedSymbol1} ${
                          parseFloat(token0?.derivedETH) ? '(' + token0USD + ')' : ''
                        }`
                      : '-'}
                  </TYPE.main>
                </RowFixed>
              </FixedPanel>
              <FixedPanel onClick={() => history.push(`/token/${token1?.id}`)}>
                <RowFixed>
                  <TokenLogo address={token1?.id} size={'16px'} />
                  <TYPE.main fontSize={'16px'} lineHeight={1} fontWeight={500} ml={'4px'}>
                    {token0 && token1
                      ? `1 ${formattedSymbol1} = ${token1Rate} ${formattedSymbol0}  ${
                          parseFloat(token1?.derivedETH) ? '(' + token1USD + ')' : ''
                        }`
                      : '-'}
                  </TYPE.main>
                </RowFixed>
              </FixedPanel>
            </AutoRow>
            <>
              {!below1080 && <TYPE.main fontSize={'1.125rem'}>Pair Stats</TYPE.main>}
              <PanelWrapper style={{ marginTop: '1.5rem' }}>
                {/*<Panel style={{ height: '100%' }}>*/}
                  {/*<AutoColumn gap="20px">*/}
                    {/*<RowBetween>*/}
                      {/*<TYPE.main>Total Liquidity {!usingTracked ? '(Untracked)' : ''}</TYPE.main>*/}
                      {/*<div />*/}
                    {/*</RowBetween>*/}
                    {/*<RowBetween align="flex-end">*/}
                      {/*<TYPE.main fontSize={'1.5rem'} lineHeight={1} fontWeight={500}>*/}
                        {/*{liquidity}*/}
                      {/*</TYPE.main>*/}
                      {/*<TYPE.main>{liquidityChange}</TYPE.main>*/}
                    {/*</RowBetween>*/}
                  {/*</AutoColumn>*/}
                {/*</Panel>*/}
                {/*<Panel style={{ height: '100%' }}>*/}
                  {/*<AutoColumn gap="20px">*/}
                    {/*<RowBetween>*/}
                      {/*<TYPE.main>Volume (24hrs) {usingUtVolume && '(Untracked)'}</TYPE.main>*/}
                      {/*<div />*/}
                    {/*</RowBetween>*/}
                    {/*<RowBetween align="flex-end">*/}
                      {/*<TYPE.main fontSize={'1.5rem'} lineHeight={1} fontWeight={500}>*/}
                        {/*{volume}*/}
                      {/*</TYPE.main>*/}
                      {/*<TYPE.main>{volumeChange}</TYPE.main>*/}
                    {/*</RowBetween>*/}
                  {/*</AutoColumn>*/}
                {/*</Panel>*/}
                {/*<Panel style={{ height: '100%' }}>*/}
                  {/*<AutoColumn gap="20px">*/}
                    {/*<RowBetween>*/}
                      {/*<TYPE.main>Fees (24hrs)</TYPE.main>*/}
                      {/*<div />*/}
                    {/*</RowBetween>*/}
                    {/*<RowBetween align="flex-end">*/}
                      {/*<TYPE.main fontSize={'1.5rem'} lineHeight={1} fontWeight={500}>*/}
                        {/*{fees}*/}
                      {/*</TYPE.main>*/}
                      {/*<TYPE.main>{volumeChange}</TYPE.main>*/}
                    {/*</RowBetween>*/}
                  {/*</AutoColumn>*/}
                {/*</Panel>*/}

                <Panel style={{ height: '100%' }}>
                  <AutoColumn gap="20px">
                    <RowBetween>
                      <TYPE.main>Pooled Tokens</TYPE.main>
                      <div />
                    </RowBetween>
                    <Hover onClick={() => history.push(`/token/${token0?.id}`)} fade={true}>
                      <AutoRow gap="4px">
                        <TokenLogo address={token0?.id} />
                        <TYPE.main fontSize={20} lineHeight={1} fontWeight={500}>
                          <RowFixed>
                            {reserve0 ? formattedNum(reserve0) : ''}{' '}
                            <FormattedName text={token0?.symbol ?? ''} maxCharacters={8} margin={true} />
                          </RowFixed>
                        </TYPE.main>
                      </AutoRow>
                    </Hover>
                    <Hover onClick={() => history.push(`/token/${token1?.id}`)} fade={true}>
                      <AutoRow gap="4px">
                        <TokenLogo address={token1?.id} />
                        <TYPE.main fontSize={20} lineHeight={1} fontWeight={500}>
                          <RowFixed>
                            {reserve1 ? formattedNum(reserve1) : ''}{' '}
                            <FormattedName text={token1?.symbol ?? ''} maxCharacters={8} margin={true} />
                          </RowFixed>
                        </TYPE.main>
                      </AutoRow>
                    </Hover>
                  </AutoColumn>
                </Panel>

                <Panel style={{ height: '100%' }}>
                  <AutoColumn gap="20px">
                    <RowBetween>
                      <TYPE.main>Calculate</TYPE.main>
                      <div />
                    </RowBetween>
                    { showloading ?
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '140px' }}>
                        <ReactLoading type={'spinningBubbles'} color={'#fff'} width={'20%'} />
                      </div> :
                      <div style={{display: 'flex', flexDirection: 'column', gridRowGap: '20px'}}>
                        <AutoRow style={{ justifyContent: 'space-between' }}>
                          <div style={{ width: '100px' }}>
                            <ReactSelect
                              styles={colourStyles}
                              options={[{value: Token0?.symbol, label: Token0?.symbol}, {value: Token1?.symbol, label:  Token1?.symbol}]}
                              defaultValue={{value: currentToken?.symbol, label: currentToken?.symbol}}
                              onChange={({value}) => {
                                if (value === Token0.symbol) {
                                  setCurrentToken(Token0)
                                } else {
                                  setCurrentToken(Token1)
                                }
                              }}
                            />
                          </div>
                          <Input
                            onChange={(e) => {
                              setR0(e.target.value)
                            }}
                            onFocus={() => {
                              if (showResult) {
                                setShowResult(false)
                              }
                            }}
                            value={r0}
                          />
                        </AutoRow>
                        <AutoRow style={{ justifyContent: 'space-between' }}>
                          <TYPE.header>Impact</TYPE.header>
                          <Input
                            onChange={(e) => {
                              setImpact(e.target.value)
                            }}
                            onFocus={() => {
                              if (showResult) {
                                setShowResult(false)
                              }
                            }}
                            value={impact}
                            placeholder="%"
                          />
                        </AutoRow>
                        <AutoRow>
                          <ButtonLight onClick={handleSwapInfo}>Calculate</ButtonLight>
                        </AutoRow>
                      </div>
                    }
                  </AutoColumn>
                </Panel>

                <Panel
                  style={{
                    gridColumn: below1080 ? '1' : '2/4',
                    gridRow: below1080 ? '' : '1/5',
                  }}
                >
                  <PairChart
                    address={pairAddress}
                    color={backgroundColor}
                    base0={reserve1 / reserve0}
                    base1={reserve0 / reserve1}
                  />
                </Panel>
              </PanelWrapper>
              <TYPE.main fontSize={'1.125rem'} style={{ marginTop: '3rem' }}>
                Transactions
              </TYPE.main>{' '}
              <Panel
                style={{
                  marginTop: '1.5rem',
                }}
              >
                {transactions ? <TxnList transactions={transactions} /> : <Loader />}
              </Panel>
              <RowBetween style={{ marginTop: '3rem' }}>
                <TYPE.main fontSize={'1.125rem'}>Pair Information</TYPE.main>{' '}
              </RowBetween>
              <Panel
                rounded
                style={{
                  marginTop: '1.5rem',
                }}
                p={20}
              >
                <TokenDetailsLayout>
                  <Column>
                    <TYPE.main>Pair Name</TYPE.main>
                    <TYPE.main style={{ marginTop: '.5rem' }}>
                      <RowFixed>
                        <FormattedName text={token0?.symbol ?? ''} maxCharacters={8} />
                        -
                        <FormattedName text={token1?.symbol ?? ''} maxCharacters={8} />
                      </RowFixed>
                    </TYPE.main>
                  </Column>
                  <Column>
                    <TYPE.main>Pair Address</TYPE.main>
                    <AutoRow align="flex-end">
                      <TYPE.main style={{ marginTop: '.5rem' }}>
                        {pairAddress.slice(0, 6) + '...' + pairAddress.slice(38, 42)}
                      </TYPE.main>
                      <CopyHelper toCopy={pairAddress} />
                    </AutoRow>
                  </Column>
                  <Column>
                    <TYPE.main>
                      <RowFixed>
                        <FormattedName text={token0?.symbol ?? ''} maxCharacters={8} />{' '}
                        <span style={{ marginLeft: '4px' }}>Address</span>
                      </RowFixed>
                    </TYPE.main>
                    <AutoRow align="flex-end">
                      <TYPE.main style={{ marginTop: '.5rem' }}>
                        {token0 && token0.id.slice(0, 6) + '...' + token0.id.slice(38, 42)}
                      </TYPE.main>
                      <CopyHelper toCopy={token0?.id} />
                    </AutoRow>
                  </Column>
                  <Column>
                    <TYPE.main>
                      <RowFixed>
                        <FormattedName text={token1?.symbol ?? ''} maxCharacters={8} />{' '}
                        <span style={{ marginLeft: '4px' }}>Address</span>
                      </RowFixed>
                    </TYPE.main>
                    <AutoRow align="flex-end">
                      <TYPE.main style={{ marginTop: '.5rem' }} fontSize={16}>
                        {token1 && token1.id.slice(0, 6) + '...' + token1.id.slice(38, 42)}
                      </TYPE.main>
                      <CopyHelper toCopy={token1?.id} />
                    </AutoRow>
                  </Column>
                  <ButtonLight color={backgroundColor}>
                    <Link color={backgroundColor} external href={'https://etherscan.io/address/' + pairAddress}>
                      View on Etherscan ↗
                    </Link>
                  </ButtonLight>
                </TokenDetailsLayout>
              </Panel>
            </>
          </DashboardWrapper>
        </WarningGrouping>
      </ContentWrapperLarge>
    </PageWrapper>
  )
}

export default withRouter(PairPage)
