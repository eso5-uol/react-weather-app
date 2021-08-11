import './App.css'
import React, { useContext } from 'react'
import { useState, useEffect, useRef } from 'react'
import getWeb3 from './getWeb3'
import User from './contracts/User.json'
import Main from './components/Main'

import { Button } from 'rimble-ui'
import { useForm } from 'react-hook-form'
import detectEthereumProvider from '@metamask/detect-provider'
import MetaMaskOnboarding from '@metamask/onboarding'
import { OnboardingButton } from './elements/OnboardingButton'
import { Switch, Route, useHistory } from 'react-router-dom'

function App() {
  const history = useHistory()
  const [networkId, setNetworkId] = useState('')
  const [contract, setContract] = useState('')
  const [accounts, setAccounts] = useState([])
  const [isActive, setIsActive] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState()
  const [userID, setUserID] = useState(0)
  const [connected, setConnected] = useState(false)
  const [userCount, setUserCount] = useState(0)
  const { register, handleSubmit } = useForm()
  const [submitting, setSubmitting] = useState(false)
  const [isReg, setIsReg] = useState(false)
  const [lastUserObj, setlastUserObj] = useState([])
  const [energyType, setEnergyType] = useState('')
  const [username, setusername] = useState('')
  const [status, setstatus] = useState('')

  useEffect(() => {
    if (isLoggedIn === false) {
      history.push('/')
    }
  }, [isLoggedIn])

  useEffect(() => {
    const init = async () => {
      try {
        const provider = await detectEthereumProvider()
        console.log(provider)
        if (provider) {
          setConnected(true)
        }

        const web3 = await getWeb3()
        const accounts = await web3.eth.getAccounts()
        console.log(accounts)
        const networkId = await web3.eth.net.getId()
        console.log(networkId)
        const deployedNetwork = User.networks[networkId]
        const contract = new web3.eth.Contract(
          User.abi,
          deployedNetwork && deployedNetwork.address,
        )

        setAccounts(accounts)
        setNetworkId(networkId)
        setContract(contract)
        setIsActive(isActive)

        const userCount = await contract.methods.getUserCount().call()
        const userID = await contract.methods.fetchUserId(accounts[0]).call()
        setUserID(userID)

        setUserCount(userCount)
        window.ethereum.on('accountsChanged', function (accounts) {
          console.log('Account changed', accounts)
          setIsLoggedIn(false)
        })
      } catch (error) {
        // Catch any errors for any of the above operations.
        alert(
          `Failed to load web3, accounts, or contract. Be sure to be on network id 5 or 5777.`,
        )
        console.error(error)
      }
    }
    init()
  }, [])

  // Mac Shift + Option + F

  const login = async () => {
    try {
      const userID = await contract.methods.fetchUserId(accounts[0]).call()
      setUserID(userID)

      const user = await contract.methods.fetchUser(userID).call()
      setIsLoggedIn(user.signed)
      console.log(user)
      history.push('/dashboard')
    } catch (error) {
      console.warn(error)
      alert('Account is not registered')
    }
  }

  const Auth = () => {
    return (
      connected && (
        <form
          onSubmit={handleSubmit(async (formData) => {
            setSubmitting(true)
            const account = accounts[0]
            const isReg = true
            setIsReg(isReg)
            try {
              await contract.methods
                .addUser(
                  formData.inputName,
                  formData.inputEnergyType,
                  formData.inputStatus,
                  isReg,
                )
                .send({ from: account })
            } catch (error) {
              alert('Account already exists for this address')
            }

            setIsLoggedIn(true)
            window.location.reload()
            setSubmitting(false)
          })}
        >
          <input
            {...register('inputName', {
              required: 'Please enter your username',
              minLength: {
                value: 6,
                message: 'Username must be 6 characters long',
              },
            })}
            placeholder="Please enter your username"
          />
          <select
            {...register('inputStatus', {
              required: 'Please select a status',
            })}
          >
            <option value="">Please Select Your Status</option>
            <option value="consumer">Consumer</option>
            <option value="prosumer">Prosumer</option>
          </select>
          <select
            {...register('inputEnergyType', {
              required: 'Please select your means of production',
            })}
          >
            <option value="">Please Select Your Means Of Production </option>
            <option value="Solar">Solar</option>
            <option value="Wind">Wind</option>
          </select>
          <p>{lastUserObj}</p>
          <input type="submit" disabled={submitting} />
          <Button onClick={login}>Login</Button>
        </form>
      )
    )
  }

  return (
    <div className="App">
      <OnboardingButton />
      <Switch>
        <Route path="/" exact component={Auth} />
        <Route path="/dashboard" component={Main} />
      </Switch>
    </div>
  )
}
export default App
