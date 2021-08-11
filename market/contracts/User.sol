pragma solidity >=0.5.0 <0.7.0;


contract User{

    //like a hash table or associative array. Key =  id, value = energy struct
    mapping (uint => Users) public users;
    mapping(address => uint) public userId;
    mapping(address => bool) _isRegistered;
    mapping(uint => Energy) public energies;

    address payable owner;
    uint userCount;
    uint public energyCount;
    bool userIsActive = true;
    bool isReg = false;
    string category;

    // uint testAmount = 100;

    enum State{
        ForSale,
        Sold
    }

    struct Users {
        uint userId;
        string name;
        string energyType;
        string status;
        bool signedUp;
  
    }

    struct Energy {
        uint id;
        uint price;
        uint energyAmount;
        string energyType;
        State state;
        address payable seller;
        bool purchased;
    }

    event EnergyCreated(
        uint id,
        uint price,
        uint energyAmount,
        string energyType,
        State state,
        address payable seller,
        bool purchased
    );

    constructor() public {
        owner = msg.sender;
        userCount = 0;
    }


    event LogAddressUser(address);
    event LogUser(uint userId);
    event LogAddressSeller(address);
    event LogAddressBuyer(address);
    event LogForSale(uint id);
    event LogSold(uint id);

    modifier userContractIsActive(){require(userIsActive == true); _;}
    modifier onlyOwner(){require(owner == msg.sender); _;}
    // modifier enoughEnergy(uint _energyAmount){require(testAmount > _energyAmount); _;}
    modifier contractIsActive() { require(userIsActive == true); _;}
    modifier paidEnough(uint _price) { require(msg.value >= _price); _;}
    modifier checkValue(uint _id) {
    _;
    uint _price = energies[_id].price;}

    

    modifier forSale(uint _id) { require(energies[_id].state == State.ForSale); _;}
    modifier sold(uint _id) { require(energies[_id].state == State.Sold); _;}

    
    function addUser(string memory _name, string memory _energyType, string memory _status, bool _isReg) contractIsActive() public returns (bool){
        require(!_isRegistered[msg.sender], "sender is already registered");
        emit LogUser(userCount);
        emit LogAddressUser(msg.sender);
        users[userCount] = Users({name: _name, userId: userCount, energyType: _energyType, status: _status, signedUp: _isReg});
        _isRegistered[msg.sender] = true;
        userId[msg.sender] = userCount;
        userCount += 1;
        return true;
    }

    function fetchUserId(address _userAddress) public view returns(uint id){
        require(_isRegistered[_userAddress], 'The user Id of this account des not exist');
        return userId[_userAddress];
    }

    function getContractStatus() public view returns (bool){
        return userIsActive;
    }

    function getUserCount() public view returns (uint id){
        return userCount;
    }

    function createEnergy(uint _energyAmount, uint _price, string memory _energyType) contractIsActive() public returns(bool) {
        emit LogForSale(energyCount);


        //Require an energy Type
        require(_energyAmount > 0);

        //Require a valid _price
        require(_price > 0);
        
        energyCount ++;
        //Create the energy
        energies[energyCount] = Energy( energyCount, _energyAmount,  _price, _energyType, State.ForSale,  msg.sender, false);
        emit EnergyCreated( energyCount, _energyAmount,  _price, _energyType, State.ForSale,  msg.sender, false);

        //Make sure parameters are correct
        return true;

    }


    function buyEnergy(uint _id) public payable forSale(_id) paidEnough(energies[_id].price) checkValue(_id) contractIsActive(){

        Energy memory _energy = energies[_id];

        energies[_id].state = State.Sold;

        address payable _seller = _energy.seller;

        require(_seller != msg.sender);

        _energy.seller = msg.sender;
        _energy.purchased = true;
        energies[_id] = _energy;
        address(_seller).transfer(msg.value);

        emit LogSold(_id);
        emit LogAddressBuyer(msg.sender);
        emit LogAddressSeller(energies[_id].seller);


    }

    function getEnergyCount() public view returns (uint id){
        return energyCount;
    }

    function fetchUser(uint _id) public view returns(string memory name, uint id, string memory energyType, string memory status, bool signed){
        name = users[_id].name;
        id = users[_id].userId;
        energyType = users[_id].energyType;
        status = users[_id].status;
        signed = users[_id].signedUp;

        return(name, id, energyType, status, signed);
    }

    // function getTestAmount() public view returns (uint id){
    //     return testAmount;

    // }

    function fetchEnergy(uint _id) public view returns (uint id, uint energyAmount, uint price, string memory energyType, uint state, address seller, bool purchased){
        
        id = energies[_id].id;
        
        energyAmount = energies[_id].energyAmount;
        price = energies[_id].price;
        energyType = energies[_id].energyType;
        state = uint(energies[_id].state);
        seller = energies[_id].seller;
        purchased = energies[_id].purchased;
        return (id, energyAmount,  price, energyType, state, seller, purchased);

    }
}
