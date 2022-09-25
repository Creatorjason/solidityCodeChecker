standard_contract_types ={
    "hello-world":`
    // SPDX-License-Identifier: MIT

    pragma solidity ^0.8.13;
    
    contract HelloWorld {
        string public greet = "Hello World!";
    }
    `,
    "counter": `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.13;
    
    contract Counter {
        uint public count;
    
        // Function to get the current count
        function get() public view returns (uint) {
            return count;
        }
    
        // Function to increment count by 1
        function inc() public {
            count += 1;
        }
    
        // Function to decrement count by 1
        function dec() public {
            // This function will fail if count = 0
            count -= 1;
        }
    }
    `,
    "send-ether":`
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.13;
    
    contract ReceiveEther {
        receive() external payable {}
    
        fallback() external payable {}
    
        function getBalance() public view returns (uint) {
            return address(this).balance;
        }
    }
    
    contract SendEther {
        function sendViaTransfer(address payable _to) public payable {
            _to.transfer(msg.value);
        }
    
        function sendViaSend(address payable _to) public payable {
            bool sent = _to.send(msg.value);
            require(sent, "Failed to send Ether");
        }
    
        function sendViaCall(address payable _to) public payable {
            (bool sent, bytes memory data) = _to.call{value: msg.value}(""
            require(sent, "Failed to send Ether");
        }
    }
    `,
    "payable":`
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.13;
    
    contract Payable {
        address payable public owner;
    
        constructor() payable {
            owner = payable(msg.sender);
        }
    
        function deposit() public payable {}
    
        function notPayable() public {}
    
      
        function withdraw() public {
          
            uint amount = address(this).balance;
    
            (bool success, ) = owner.call{value: amount}("");
            require(success, "Failed to send Ether");
        }
    
        function transfer(address payable _to, uint _amount) public {
            (bool success, ) = _to.call{value: _amount}("");
            require(success, "Failed to send Ether");
        }
    }
    `,
    "ether-wallet":`
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.13;
    
    contract EtherWallet {
        address payable public owner;
    
        constructor() {
            owner = payable(msg.sender);
        }
    
        receive() external payable {}
    
        function withdraw(uint _amount) external {
            require(msg.sender == owner, "caller is not owner");
            payable(msg.sender).transfer(_amount);
        }
    
        function getBalance() external view returns (uint) {
            return address(this).balance;
        }
    }
    `,
    "multi-sig":
    `// SPDX-License-Identifier: MIT
    pragma solidity ^0.8.13;
    
    contract MultiSigWallet {
        event Deposit(address indexed sender, uint amount, uint balance);
        event SubmitTransaction(
            address indexed owner,
            uint indexed txIndex,
            address indexed to,
            uint value,
            bytes data
        );
        event ConfirmTransaction(address indexed owner, uint indexed txInd
        event RevokeConfirmation(address indexed owner, uint indexed txInd
        event ExecuteTransaction(address indexed owner, uint indexed txInd
    
        address[] public owners;
        mapping(address => bool) public isOwner;
        uint public numConfirmationsRequired;
    
        struct Transaction {
            address to;
            uint value;
            bytes data;
            bool executed;
            uint numConfirmations;
        }
    
        mapping(uint => mapping(address => bool)) public isConfirmed;
    
        Transaction[] public transactions;
    
        modifier onlyOwner() {
            require(isOwner[msg.sender], "not owner");
            _;
        }
    
        modifier txExists(uint _txIndex) {
            require(_txIndex < transactions.length, "tx does not exist");
            _;
        }
    
        modifier notExecuted(uint _txIndex) {
            require(!transactions[_txIndex].executed, "tx already executed
            _;
        }
    
        modifier notConfirmed(uint _txIndex) {
            require(!isConfirmed[_txIndex][msg.sender], "tx already confir
            _;
        }
    
        constructor(address[] memory _owners, uint _numConfirmationsRequir
            require(_owners.length > 0, "owners required");
            require(
                _numConfirmationsRequired > 0 &&
                    _numConfirmationsRequired <= _owners.length,
                "invalid number of required confirmations"
            );
    
            for (uint i = 0; i < _owners.length; i++) {
                address owner = _owners[i];
    
                require(owner != address(0), "invalid owner");
                require(!isOwner[owner], "owner not unique");
    
                isOwner[owner] = true;
                owners.push(owner);
            }
    
            numConfirmationsRequired = _numConfirmationsRequired;
        }
    
        receive() external payable {
            emit Deposit(msg.sender, msg.value, address(this).balance);
        }
    
        function submitTransaction(
            address _to,
            uint _value,
            bytes memory _data
        ) public onlyOwner {
            uint txIndex = transactions.length;
    
            transactions.push(
                Transaction({
                    to: _to,
                    value: _value,
                    data: _data,
                    executed: false,
                    numConfirmations: 0
                })
            );
    
            emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data
        }
    
        function confirmTransaction(uint _txIndex)
            public
            onlyOwner
            txExists(_txIndex)
            notExecuted(_txIndex)
            notConfirmed(_txIndex)
        {
            Transaction storage transaction = transactions[_txIndex];
            transaction.numConfirmations += 1;
            isConfirmed[_txIndex][msg.sender] = true;
    
            emit ConfirmTransaction(msg.sender, _txIndex);
        }
    
        function executeTransaction(uint _txIndex)
            public
            onlyOwner
            txExists(_txIndex)
            notExecuted(_txIndex)
        {
            Transaction storage transaction = transactions[_txIndex];
    
            require(
                transaction.numConfirmations >= numConfirmationsRequired,
                "cannot execute tx"
            );
    
            transaction.executed = true;
    
            (bool success, ) = transaction.to.call{value: transaction.valu
                transaction.data
            );
            require(success, "tx failed");
    
            emit ExecuteTransaction(msg.sender, _txIndex);
        }
    
        function revokeConfirmation(uint _txIndex)
            public
            onlyOwner
            txExists(_txIndex)
            notExecuted(_txIndex)
        {
            Transaction storage transaction = transactions[_txIndex];
    
            require(isConfirmed[_txIndex][msg.sender], "tx not confirmed")
    
            transaction.numConfirmations -= 1;
            isConfirmed[_txIndex][msg.sender] = false;
    
            emit RevokeConfirmation(msg.sender, _txIndex);
        }
    
        function getOwners() public view returns (address[] memory) {
            return owners;
        }
    
        function getTransactionCount() public view returns (uint) {
            return transactions.length;
        }
    
        function getTransaction(uint _txIndex)
            public
            view
            returns (
                address to,
                uint value,
                bytes memory data,
                bool executed,
                uint numConfirmations
            )
        {
            Transaction storage transaction = transactions[_txIndex];
    
            return (
                transaction.to,
                transaction.value,
                transaction.data,
                transaction.executed,
                transaction.numConfirmations
            );
        }
    }
    `,
    "merkle-root":
    `// SPDX-License-Identifier: MIT
    pragma solidity ^0.8.13;
    
    contract MerkleProof {
        function verify(
            bytes32[] memory proof,
            bytes32 root,
            bytes32 leaf,
            uint index
        ) public pure returns (bool) {
            bytes32 hash = leaf;
    
            for (uint i = 0; i < proof.length; i++) {
                bytes32 proofElement = proof[i];
    
                if (index % 2 == 0) {
                    hash = keccak256(abi.encodePacked(hash, proofElement))
                } else {
                    hash = keccak256(abi.encodePacked(proofElement, hash))
                }
    
                index = index / 2;
            }
    
            return hash == root;
        }
    }
    
    contract TestMerkleProof is MerkleProof {
        bytes32[] public hashes;
    
        constructor() {
            string[4] memory transactions = [
                "alice -> bob",
                "bob -> dave",
                "carol -> alice",
                "dave -> bob"
            ];
    
            for (uint i = 0; i < transactions.length; i++) {
                hashes.push(keccak256(abi.encodePacked(transactions[i])));
            }
    
            uint n = transactions.length;
            uint offset = 0;
    
            while (n > 0) {
                for (uint i = 0; i < n - 1; i += 2) {
                    hashes.push(
                        keccak256(
                            abi.encodePacked(hashes[offset + i], hashes[of
                        )
                    );
                }
                offset += n;
                n = n / 2;
            }
        }
    
        function getRoot() public view returns (bytes32) {
            return hashes[hashes.length - 1];
        }
    `,
    "iterable-mapping":
    `// SPDX-License-Identifier: MIT
    pragma solidity ^0.8.13;
    
    library IterableMapping {
        struct Map {
            address[] keys;
            mapping(address => uint) values;
            mapping(address => uint) indexOf;
            mapping(address => bool) inserted;
        }
    
        function get(Map storage map, address key) public view returns (ui
            return map.values[key];
        }
    
        function getKeyAtIndex(Map storage map, uint index) public view re
            return map.keys[index];
        }
    
        function size(Map storage map) public view returns (uint) {
            return map.keys.length;
        }
    
        function set(
            Map storage map,
            address key,
            uint val
        ) public {
            if (map.inserted[key]) {
                map.values[key] = val;
            } else {
                map.inserted[key] = true;
                map.values[key] = val;
                map.indexOf[key] = map.keys.length;
                map.keys.push(key);
            }
        }
    
        function remove(Map storage map, address key) public {
            if (!map.inserted[key]) {
                return;
            }
    
            delete map.inserted[key];
            delete map.values[key];
    
            uint index = map.indexOf[key];
            uint lastIndex = map.keys.length - 1;
            address lastKey = map.keys[lastIndex];
    
            map.indexOf[lastKey] = index;
            delete map.indexOf[key];
    
            map.keys[index] = lastKey;
            map.keys.pop();
        }
    }
    
    contract TestIterableMap {
        using IterableMapping for IterableMapping.Map;
    
        IterableMapping.Map private map;
    
        function testIterableMap() public {
            map.set(address(0), 0);
            map.set(address(1), 100);
            map.set(address(2), 200); // insert
            map.set(address(2), 200); // update
            map.set(address(3), 300);
    
            for (uint i = 0; i < map.size(); i++) {
                address key = map.getKeyAtIndex(i);
    
                assert(map.get(key) == i * 100);
            }
    
            map.remove(address(1));
    
            // keys = [address(0), address(3), address(2)]
            assert(map.size() == 3);
            assert(map.getKeyAtIndex(0) == address(0));
            assert(map.getKeyAtIndex(1) == address(3));
            assert(map.getKeyAtIndex(2) == address(2));
        }
    }
    `,
    "ERC20":`
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.13;
    
    import "./IERC20.sol";
    
    contract ERC20 is IERC20 {
        uint public totalSupply;
        mapping(address => uint) public balanceOf;
        mapping(address => mapping(address => uint)) public allowance;
        string public name = "Solidity by Example";
        string public symbol = "SOLBYEX";
        uint8 public decimals = 18;
    
        function transfer(address recipient, uint amount) external returns
            balanceOf[msg.sender] -= amount;
            balanceOf[recipient] += amount;
            emit Transfer(msg.sender, recipient, amount);
            return true;
        }
    
        function approve(address spender, uint amount) external returns (b
            allowance[msg.sender][spender] = amount;
            emit Approval(msg.sender, spender, amount);
            return true;
        }
    
        function transferFrom(
            address sender,
            address recipient,
            uint amount
        ) external returns (bool) {
            allowance[sender][msg.sender] -= amount;
            balanceOf[sender] -= amount;
            balanceOf[recipient] += amount;
            emit Transfer(sender, recipient, amount);
            return true;
        }
    
        function mint(uint amount) external {
            balanceOf[msg.sender] += amount;
            totalSupply += amount;
            emit Transfer(address(0), msg.sender, amount);
        }
    
        function burn(uint amount) external {
            balanceOf[msg.sender] -= amount;
            totalSupply -= amount;
            emit Transfer(msg.sender, address(0), amount);
        }
    }
    `,
    "ERC721":`
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.13;
    
    interface IERC165 {
        function supportsInterface(bytes4 interfaceID) external view retur
    }
    
    interface IERC721 is IERC165 {
        function balanceOf(address owner) external view returns (uint bala
    
        function ownerOf(uint tokenId) external view returns (address owne
    
        function safeTransferFrom(
            address from,
            address to,
            uint tokenId
        ) external;
    
        function safeTransferFrom(
            address from,
            address to,
            uint tokenId,
            bytes calldata data
        ) external;
    
        function transferFrom(
            address from,
            address to,
            uint tokenId
        ) external;
    
        function approve(address to, uint tokenId) external;
    
        function getApproved(uint tokenId) external view returns (address 
    
        function setApprovalForAll(address operator, bool _approved) exter
    
        function isApprovedForAll(address owner, address operator)
            external
            view
            returns (bool);
    }
    
    interface IERC721Receiver {
        function onERC721Received(
            address operator,
            address from,
            uint tokenId,
            bytes calldata data
        ) external returns (bytes4);
    }
    
    contract ERC721 is IERC721 {
        event Transfer(address indexed from, address indexed to, uint inde
        event Approval(address indexed owner, address indexed spender, uin
        event ApprovalForAll(
            address indexed owner,
            address indexed operator,
            bool approved
        );
    
        // Mapping from token ID to owner address
        mapping(uint => address) internal _ownerOf;
    
        // Mapping owner address to token count
        mapping(address => uint) internal _balanceOf;
    
        // Mapping from token ID to approved address
        mapping(uint => address) internal _approvals;
    
        // Mapping from owner to operator approvals
        mapping(address => mapping(address => bool)) public isApprovedForA
    
        function supportsInterface(bytes4 interfaceId) external pure retur
            return
                interfaceId == type(IERC721).interfaceId ||
                interfaceId == type(IERC165).interfaceId;
        }
    
        function ownerOf(uint id) external view returns (address owner) {
            owner = _ownerOf[id];
            require(owner != address(0), "token doesn't exist");
        }
    
        function balanceOf(address owner) external view returns (uint) {
            require(owner != address(0), "owner = zero address");
            return _balanceOf[owner];
        }
    
        function setApprovalForAll(address operator, bool approved) extern
            isApprovedForAll[msg.sender][operator] = approved;
            emit ApprovalForAll(msg.sender, operator, approved);
        }
    
        function approve(address spender, uint id) external {
            address owner = _ownerOf[id];
            require(
                msg.sender == owner || isApprovedForAll[owner][msg.sender]
                "not authorized"
            );
    
            _approvals[id] = spender;
    
            emit Approval(owner, spender, id);
        }
    
        function getApproved(uint id) external view returns (address) {
            require(_ownerOf[id] != address(0), "token doesn't exist");
            return _approvals[id];
        }
    
        function _isApprovedOrOwner(
            address owner,
            address spender,
            uint id
        ) internal view returns (bool) {
            return (spender == owner ||
                isApprovedForAll[owner][spender] ||
                spender == _approvals[id]);
        }
    
        function transferFrom(
            address from,
            address to,
            uint id
        ) public {
            require(from == _ownerOf[id], "from != owner");
            require(to != address(0), "transfer to zero address");
    
            require(_isApprovedOrOwner(from, msg.sender, id), "not authori
    
            _balanceOf[from]--;
            _balanceOf[to]++;
            _ownerOf[id] = to;
    
            delete _approvals[id];
    
            emit Transfer(from, to, id);
        }
    
        function safeTransferFrom(
            address from,
            address to,
            uint id
        ) external {
            transferFrom(from, to, id);
    
            require(
                to.code.length == 0 ||
                    IERC721Receiver(to).onERC721Received(msg.sender, from,
                    IERC721Receiver.onERC721Received.selector,
                "unsafe recipient"
            );
        }
    
        function safeTransferFrom(
            address from,
            address to,
            uint id,
            bytes calldata data
        ) external {
            transferFrom(from, to, id);
    
            require(
                to.code.length == 0 ||
                    IERC721Receiver(to).onERC721Received(msg.sender, from,
                    IERC721Receiver.onERC721Received.selector,
                "unsafe recipient"
            );
        }
    
        function _mint(address to, uint id) internal {
            require(to != address(0), "mint to zero address");
            require(_ownerOf[id] == address(0), "already minted");
    
            _balanceOf[to]++;
            _ownerOf[id] = to;
    
            emit Transfer(address(0), to, id);
        }
    
        function _burn(uint id) internal {
            address owner = _ownerOf[id];
            require(owner != address(0), "not minted");
    
            _balanceOf[owner] -= 1;
    
            delete _ownerOf[id];
            delete _approvals[id];
    
            emit Transfer(owner, address(0), id);
        }
    }
    
    contract MyNFT is ERC721 {
        function mint(address to, uint id) external {
            _mint(to, id);
        }
    
        function burn(uint id) external {
            require(msg.sender == _ownerOf[id], "not owner");
            _burn(id);
        }
    }
    `,
    "english-auction":
    `// SPDX-License-Identifier: MIT
    pragma solidity ^0.8.13;
    
    interface IERC721 {
        function safeTransferFrom(
            address from,
            address to,
            uint tokenId
        ) external;
    
        function transferFrom(
            address,
            address,
            uint
        ) external;
    }
    
    contract EnglishAuction {
        event Start();
        event Bid(address indexed sender, uint amount);
        event Withdraw(address indexed bidder, uint amount);
        event End(address winner, uint amount);
    
        IERC721 public nft;
        uint public nftId;
    
        address payable public seller;
        uint public endAt;
        bool public started;
        bool public ended;
    
        address public highestBidder;
        uint public highestBid;
        mapping(address => uint) public bids;
    
        constructor(
            address _nft,
            uint _nftId,
            uint _startingBid
        ) {
            nft = IERC721(_nft);
            nftId = _nftId;
    
            seller = payable(msg.sender);
            highestBid = _startingBid;
        }
    
        function start() external {
            require(!started, "started");
            require(msg.sender == seller, "not seller");
    
            nft.transferFrom(msg.sender, address(this), nftId);
            started = true;
            endAt = block.timestamp + 7 days;
    
            emit Start();
        }
    
        function bid() external payable {
            require(started, "not started");
            require(block.timestamp < endAt, "ended");
            require(msg.value > highestBid, "value < highest");
    
            if (highestBidder != address(0)) {
                bids[highestBidder] += highestBid;
            }
    
            highestBidder = msg.sender;
            highestBid = msg.value;
    
            emit Bid(msg.sender, msg.value);
        }
    
        function withdraw() external {
            uint bal = bids[msg.sender];
            bids[msg.sender] = 0;
            payable(msg.sender).transfer(bal);
    
            emit Withdraw(msg.sender, bal);
        }
    
        function end() external {
            require(started, "not started");
            require(block.timestamp >= endAt, "not ended");
            require(!ended, "ended");
    
            ended = true;
            if (highestBidder != address(0)) {
                nft.safeTransferFrom(address(this), highestBidder, nftId);
                seller.transfer(highestBid);
            } else {
                nft.safeTransferFrom(address(this), seller, nftId);
            }
    
            emit End(highestBidder, highestBid);
        }
    }
    `,
    "dutch-auction":`// SPDX-License-Identifier: MIT
    pragma solidity ^0.8.13;
    
    interface IERC721 {
        function transferFrom(
            address _from,
            address _to,
            uint _nftId
        ) external;
    }
    
    contract DutchAuction {
        uint private constant DURATION = 7 days;
    
        IERC721 public immutable nft;
        uint public immutable nftId;
    
        address payable public immutable seller;
        uint public immutable startingPrice;
        uint public immutable startAt;
        uint public immutable expiresAt;
        uint public immutable discountRate;
    
        constructor(
            uint _startingPrice,
            uint _discountRate,
            address _nft,
            uint _nftId
        ) {
            seller = payable(msg.sender);
            startingPrice = _startingPrice;
            startAt = block.timestamp;
            expiresAt = block.timestamp + DURATION;
            discountRate = _discountRate;
    
            require(_startingPrice >= _discountRate * DURATION, "starting 
    
            nft = IERC721(_nft);
            nftId = _nftId;
        }
    
        function getPrice() public view returns (uint) {
            uint timeElapsed = block.timestamp - startAt;
            uint discount = discountRate * timeElapsed;
            return startingPrice - discount;
        }
    
        function buy() external payable {
            require(block.timestamp < expiresAt, "auction expired");
    
            uint price = getPrice();
            require(msg.value >= price, "ETH < price");
    
            nft.transferFrom(seller, msg.sender, nftId);
            uint refund = msg.value - price;
            if (refund > 0) {
                payable(msg.sender).transfer(refund);
            }
            selfdestruct(seller);
        }
    }
    `,
    "crowd-fund":
    `// SPDX-License-Identifier: MIT
    pragma solidity ^0.8.13;
    
    interface IERC20 {
        function transfer(address, uint) external returns (bool);
    
        function transferFrom(
            address,
            address,
            uint
        ) external returns (bool);
    }
    
    contract CrowdFund {
        event Launch(
            uint id,
            address indexed creator,
            uint goal,
            uint32 startAt,
            uint32 endAt
        );
        event Cancel(uint id);
        event Pledge(uint indexed id, address indexed caller, uint amount)
        event Unpledge(uint indexed id, address indexed caller, uint amoun
        event Claim(uint id);
        event Refund(uint id, address indexed caller, uint amount);
    
        struct Campaign {
            
            address creator;
            
            uint goal;
           
            uint pledged;
           
            uint32 startAt;
            
            uint32 endAt;
        
            bool claimed;
        }
    
        IERC20 public immutable token;
      
      
        uint public count;
      
        mapping(uint => Campaign) public campaigns;
       
        mapping(uint => mapping(address => uint)) public pledgedAmount;
    
        constructor(address _token) {
            token = IERC20(_token);
        }
    
        function launch(
            uint _goal,
            uint32 _startAt,
            uint32 _endAt
        ) external {
            require(_startAt >= block.timestamp, "start at < now");
            require(_endAt >= _startAt, "end at < start at");
            require(_endAt <= block.timestamp + 90 days, "end at > max dur
    
            count += 1;
            campaigns[count] = Campaign({
                creator: msg.sender,
                goal: _goal,
                pledged: 0,
                startAt: _startAt,
                endAt: _endAt,
                claimed: false
            });
    
            emit Launch(count, msg.sender, _goal, _startAt, _endAt);
        }
    
        function cancel(uint _id) external {
            Campaign memory campaign = campaigns[_id];
            require(campaign.creator == msg.sender, "not creator");
            require(block.timestamp < campaign.startAt, "started");
    
            delete campaigns[_id];
            emit Cancel(_id);
        }
    
        function pledge(uint _id, uint _amount) external {
            Campaign storage campaign = campaigns[_id];
            require(block.timestamp >= campaign.startAt, "not started");
            require(block.timestamp <= campaign.endAt, "ended");
    
            campaign.pledged += _amount;
            pledgedAmount[_id][msg.sender] += _amount;
            token.transferFrom(msg.sender, address(this), _amount);
    
            emit Pledge(_id, msg.sender, _amount);
        }
    
        function unpledge(uint _id, uint _amount) external {
            Campaign storage campaign = campaigns[_id];
            require(block.timestamp <= campaign.endAt, "ended");
    
            campaign.pledged -= _amount;
            pledgedAmount[_id][msg.sender] -= _amount;
            token.transfer(msg.sender, _amount);
    
            emit Unpledge(_id, msg.sender, _amount);
        }
    
        function claim(uint _id) external {
            Campaign storage campaign = campaigns[_id];
            require(campaign.creator == msg.sender, "not creator");
            require(block.timestamp > campaign.endAt, "not ended");
            require(campaign.pledged >= campaign.goal, "pledged < goal");
            require(!campaign.claimed, "claimed");
    
            campaign.claimed = true;
            token.transfer(campaign.creator, campaign.pledged);
    
            emit Claim(_id);
        }
    
        function refund(uint _id) external {
            Campaign memory campaign = campaigns[_id];
            require(block.timestamp > campaign.endAt, "not ended");
            require(campaign.pledged < campaign.goal, "pledged >= goal");
    
            uint bal = pledgedAmount[_id][msg.sender];
            pledgedAmount[_id][msg.sender] = 0;
            token.transfer(msg.sender, bal);
    
            emit Refund(_id, msg.sender, bal);
        }
    }
    `,
    "vault":`// SPDX-License-Identifier: MIT
    pragma solidity ^0.8.13;
    
    contract Vault {
        IERC20 public immutable token;
    
        uint public totalSupply;
        mapping(address => uint) public balanceOf;
    
        constructor(address _token) {
            token = IERC20(_token);
        }
    
        function _mint(address _to, uint _shares) private {
            totalSupply += _shares;
            balanceOf[_to] += _shares;
        }
    
        function _burn(address _from, uint _shares) private {
            totalSupply -= _shares;
            balanceOf[_from] -= _shares;
        }
    
        function deposit(uint _amount) external {
    
    
            uint shares;
            if (totalSupply == 0) {
                shares = _amount;
            } else {
                shares = (_amount * totalSupply) / token.balanceOf(address
            }
    
            _mint(msg.sender, shares);
            token.transferFrom(msg.sender, address(this), _amount);
        }
    
        function withdraw(uint _shares) external {
            uint amount = (_shares * token.balanceOf(address(this))) / tot
            _burn(msg.sender, _shares);
            token.transfer(msg.sender, amount);
        }
    }
    
    interface IERC20 {
        function totalSupply() external view returns (uint);
    
        function balanceOf(address account) external view returns (uint);
    
        function transfer(address recipient, uint amount) external returns
    
        function allowance(address owner, address spender) external view r
    
        function approve(address spender, uint amount) external returns (b
    
        function transferFrom(
            address sender,
            address recipient,
            uint amount
        ) external returns (bool);
    
        event Transfer(address indexed from, address indexed to, uint amount
        event Approval(address indexed owner, address indexed spender, uin
    }
    `,
    "self-destruct":`
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.13;
    contract EtherGame {
        uint public targetAmount = 7 ether;
        address public winner;
    
        function deposit() public payable {
            require(msg.value == 1 ether, "You can only send 1 Ether");
    
            uint balance = address(this).balance;
            require(balance <= targetAmount, "Game is over");
    
            if (balance == targetAmount) {
                winner = msg.sender;
            }
        }
    
        function claimReward() public {
            require(msg.sender == winner, "Not winner");
    
            (bool sent, ) = msg.sender.call{value: address(this).balance}(
            require(sent, "Failed to send Ether");
        }
    }
    
    contract Attack {
        EtherGame etherGame;
    
        constructor(EtherGame _etherGame) {
            etherGame = EtherGame(_etherGame);
        }
    
        function attack() public payable {
            // You can simply break the game by sending ether so that
            // the game balance >= 7 ether
    
            // cast address to payable
            address payable addr = payable(address(etherGame));
            selfdestruct(addr);
        }
    }
    `
}