import React, { useState, useEffect } from 'react'
import getWeb3 from '../getWeb3'
import User from '../contracts/User.json'
import Web3 from 'web3'
import { Input, Box, Table, Button } from 'rimble-ui'
import { useForm } from 'react-hook-form'

function Main(props) {
  const [energyCount, setEnergyCount] = useState(0)
  const [name, setName] = useState('')
  const [energyType, setEnergyType] = useState('')
  const [status, setStatus] = useState('')
  const [index, setIndex] = useState(0)

  const [userObj, setUserObj] = useState([])
  const [energies, setEnergies] = useState([])

  const [inputPrice, setInputPrice] = useState(0)
  const [inputAmount, setInputAmount] = useState(0)
  const [inputId, setInputId] = useState('')

  const [sellerID, setSellerID] = useState(0)

  const [accounts, setAccounts] = useState([])
  const [networkId, setNetworkId] = useState('')
  const [contract, setContract] = useState('')
  const [loading, setLoading] = useState(false)
  const [isProsumer, setProsumer] = useState(false)
  const [userId, setUserId] = useState(0)

  //Load contract and current account
  useEffect(() => {
    console.log('useEffect')
    const init = async () => {
      try {

        const web3 = await getWeb3()

        const accounts = await web3.eth.getAccounts()
  
        const networkId = await web3.eth.net.getId()
        const deployedNetwork = User.networks[networkId]
        const contract = new web3.eth.Contract(
          User.abi,
          deployedNetwork && deployedNetwork.address,
        )



        const energyCount = await contract.methods.getEnergyCount().call()
        setNetworkId(networkId)
        setAccounts(accounts)
        setContract(contract)
        setEnergyCount(energyCount)
        const userId = await contract.methods.fetchUserId(accounts[0]).call()
        setUserId(userId)
        const user = await contract.methods.fetchUser(userId).call()
        const energyType = user.energyType
        const name = user.name
        setEnergyType(energyType)
        setName(name)
        setProsumer(user.status == 'prosumer')
        
      } catch (error) {
        alert(`accounts have failed to load `)
        console.error(error)
      }
    }
    init()
  }, [])
  //Fetch Api Data
  const [DailyWindGeneration, setwind] = useState(0)
  const [DailySolarGeneration, setsolar] = useState(0)
  const [etherPer, setEtherPer] = useState(0)
  useEffect(() => {
    async function fetchData() {
      const apiUrl1 =
        'https://developer.nrel.gov/api/utility_rates/v3.json?api_key=NrPcvtvTmYMjC45pCdLWG5ZwTXuQGwygy8JaL3bd&lat=35.45&lon=-82.98'
      const apiUrl2 =
        'http://api.openweathermap.org/data/2.5/weather?q=London&appid=40d84b2193a4096140e348c7e308fa46'
      const response = await fetch(apiUrl1)
      const response2 = await fetch(apiUrl2)
      const data = await response.json()
      const data2 = await response2.json()
      var utilityData = Object.entries(data)
      var utilityData2 = Object.entries(data2)
      var utilityPrice = utilityData[5][1].commercial
      var windSpeed = utilityData2[5][1].speed
      const DailyWindGeneration = Number(
        0.5 * windSpeed * 12.56 * 1.225 * 0.59,
      ).toFixed(2)
      const DailySolarGeneration = Number((4 * 950) / 365).toFixed(2)
      const Priceper = Number(utilityPrice).toFixed(2)
      setsolar(DailySolarGeneration)
      setwind(DailyWindGeneration)
      setEtherPer(Priceper);
    }
    fetchData()
  }, [])


  const fetchEnergies = async () => {
    const energyCount = await contract.methods.getEnergyCount().call()
    const energies = []

    for (var index = 1; index <= energyCount; index++) {
      const energy = await contract.methods.fetchEnergy(index).call()

      if (energy.purchased) continue
      

      energies.push(energy)
    }

    setEnergyCount(energyCount)
    setEnergies(energies)
  }

  useEffect(() => {}, [energies])

  const TableHeader = () => {
    let headerElement = ['id', 'energyType', 'amount', 'price', 'seller', '']

    return (
      <thead>
        <tr>
          {headerElement.map((key, index) => (
            <th key={index}>{key.toUpperCase()}</th>
          ))}
        </tr>
      </thead>
    )
  }
  const TableBody = () => {
    console.log({ energies })
    return (
      <tbody>
        {energies.map(({ id, energyType, energyAmount, price, seller }) => (
          <tr key={id}>
            <td>{id}</td>
            <td>{energyType}</td>
            <td>{energyAmount}</td>
            <td>{price}</td>
            <td className="text-small">{seller}</td>
            <td>
              <button onClick={() => buyItemDirect(id, price)}>Buy</button>
            </td>
          </tr>
        ))}
      </tbody>
    )
  }


  const buyItemDirect = (id, price) => {
    const account = accounts[0]

    // const index = 0;
    const energyId = id /* lastEnergysObj[index].id; */
    const energyPrice = price /* lastEnergysObj[index].price; */
    console.log(id, price)

    contract.methods
      .buyEnergy(energyId)
      .send({ from: account, value: energyPrice })
  }

  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  const Prosumer = () => {
    return (
      <div>
        <form
          onSubmit={handleSubmit(async (formData) => {
            setSubmitting(true)
            const account = accounts[0]
            await contract.methods
              .createEnergy(
                formData.inputAmount,
                Web3.utils.toWei(formData.inputPrice, 'ether'),
                energyType,
              )
              .send({ from: account })
            setSubmitting(false)
            reset()
          })}
        >
          <input {...register('inputAmount')} placeholder="Energy Amount" />
          <input {...register('inputPrice')} placeholder="Price in Ether" />
          <input type="submit" disabled={submitting} />
        </form>
      </div>
    )
  }

  return (
    <div>
      <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
        <ul className="navbar-nav px-3 flex">
          <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
            <small className="text-white">
              <b>Accounts</b>
              <br />
              <span title="Accounts" id="account">
                {accounts}
              </span>
            </small>
          </li>
          <li>
            <small className="text-white">
              <b>Daily generation</b>
              <br />
              <span title="Daily generation" id="WenergyGeneration">
                {DailyWindGeneration} kwh
              </span>
            </small>
          </li>
          <li>
            <small className="text-white">
              <b>Daily Solar Generation</b>
              <br />
              <span
                title="Daily Solar Generation"
                id="SenergyGeneration"
              ></span>
              {DailySolarGeneration} kwh
            </small>
          </li>
          <li>
            <small className="text-white">
              <b>Ether per hour</b>
              <br />
              <span
                title="Ether"
                id="EtherperHour"
              ></span>
              {etherPer} Gwei
            </small>
          </li>
        </ul>
      </nav>
      {isProsumer && <Prosumer />}
      <div>
        <Button onClick={fetchEnergies}>Fetch energy</Button>
        <table className="mt">
          <TableHeader />
          <TableBody />
        </table>
      </div>
    </div>
  )
}
export default Main
