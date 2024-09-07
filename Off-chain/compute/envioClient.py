import hypersync 
from hypersync import BlockField, JoinMode, TransactionField, LogField, ClientConfig, TransactionSelection


addresses = [
    "0x8c9c46f67d5061c63829fdF37EAdF51E213BFEcb".lower(),
    "0xc0A101c4E9Bb4463BD2F5d6833c2276C36914Fb6".lower(),
    "0xa0FBaEdC4C110f5A0c5E96c3eeAC9B5635b74CE7".lower(),
]

LOG_EVENTS = [
                LogField.LOG_INDEX,
                LogField.TRANSACTION_INDEX,
                LogField.TRANSACTION_HASH,
                LogField.DATA,
                LogField.ADDRESS,
                LogField.TOPIC0,
                LogField.TOPIC1,
                LogField.TOPIC2,
                LogField.TOPIC3,
			]

TRANSACTIONS = [
                TransactionField.BLOCK_NUMBER,
                TransactionField.TRANSACTION_INDEX,
                TransactionField.HASH,
                TransactionField.FROM,
                TransactionField.TO,
                TransactionField.VALUE,
                TransactionField.INPUT,
			]

# Convert address to topic for filtering. Padds the address with zeroes.
def address_to_topic(address):
    return "0x000000000000000000000000" + address[2:]

def getClient(url: str):
    client = client = hypersync.HypersyncClient(ClientConfig())
    return client 

async def runWalletQuery(client):
    address_topic_filter = list(map(address_to_topic, addresses))
    # The query to run
    query = hypersync.Query(
        from_block=0,
        # The logs we want. We will also automatically get transactions and blocks relating to these logs (the query implicitly joins them).
        logs=[
            hypersync.LogSelection(
                # We want All ERC20 transfers coming to any of our addresses
                topics=[
                    [
                        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
                    ],
                    [],
                    address_topic_filter,
                    [],
                ],
            ),
            hypersync.LogSelection(
                # We want All ERC20 transfers going from any of our addresses
                topics=[
                    [
                        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
                    ],
                    address_topic_filter,
                    [],
                    [],
                ]
            ),
        ],
        transactions=[
            # get all transactions coming from and going to any of our addresses.
			hypersync.TransactionSelection(from_=addresses),
			hypersync.TransactionSelection(to=addresses),
		],
        # Select the fields we are interested in, notice topics are selected as topic0,1,2,3
        field_selection=hypersync.FieldSelection(
			block=[
				BlockField.NUMBER,
				BlockField.TIMESTAMP,
				BlockField.HASH,
			],
			log=[
				LogField.BLOCK_NUMBER,
                LogField.LOG_INDEX,
                LogField.TRANSACTION_INDEX,
                LogField.TRANSACTION_HASH,
                LogField.DATA,
                LogField.ADDRESS,
                LogField.TOPIC0,
                LogField.TOPIC1,
                LogField.TOPIC2,
                LogField.TOPIC3,
			],
            transaction=[
                TransactionField.BLOCK_NUMBER,
                TransactionField.TRANSACTION_INDEX,
                TransactionField.HASH,
                TransactionField.FROM,
                TransactionField.TO,
                TransactionField.VALUE,
                TransactionField.INPUT,
            ]
		)
    )

    print("Running the query...")

    res = await client.collect(query, hypersync.StreamConfig())

    print(f"Ran the query once.  Next block to query is {res.next_block}")

    decoder = hypersync.Decoder([
        "Transfer(address indexed from, address indexed to, uint256 value)"
    ])

    # Decode the log on a background thread so we don't block the event loop.
    # Can also use decoder.decode_logs_sync if it is more convenient.
    decoded_logs = await decoder.decode_logs(res.data.logs)

    # Let's count total volume for each address, it is meaningless because of currency differences but good as an example.
    total_erc20_volume = {}

    for log in decoded_logs:
        #skip invalid logs
        if log is None:
            continue

        # Check if the keys exist in the dictionary, if not, initialize them with 0
        total_erc20_volume[log.indexed[0].val] = total_erc20_volume.get(log.indexed[0].val, 0)
        total_erc20_volume[log.indexed[1].val] = total_erc20_volume.get(log.indexed[1].val, 0)

        # We count for both sides but we will filter by our addresses later
        # so we will ignore unnecessary addresses.
        total_erc20_volume[log.indexed[0].val] += log.body[0].val
        total_erc20_volume[log.indexed[1].val] += log.body[0].val
    
    erctransfers = {}

    for address in addresses:
        erc20_volume = total_erc20_volume.get(address, 0)
        print(f"total erc20 transfer voume for address {address} is {erc20_volume}")
        erctransfers[address] = erc20_volume

    total_wei_volume = {}
    for tx in res.data.transactions:
        # `from` is reserved in python so hypersync uses `from_`
        total_wei_volume[tx.from_] = total_wei_volume.get(tx.from_, 0)
        total_wei_volume[tx.to] = total_wei_volume.get(tx.to, 0)

        total_wei_volume[tx.from_] += int(tx.value, 16)
        total_wei_volume[tx.to] += int(tx.value, 16)

    weitransfers = {}
    for address in addresses:
        print(
            f"total wei transfer volume for address {address} is {total_wei_volume.get(address, 0)}"
        )
        weitransfers[address] = total_wei_volume.get(address, 0)
    return {"erc20_transfers": erctransfers, "wei_transfers": weitransfers}
        

async def runQueryBlockData(client=None, logs= LOG_EVENTS, transactions = TRANSACTIONS):
    if client is None: return "Please provide a client"
    query = hypersync.Query(
        # only get block 20224332
		from_block=229270,
        to_block=229285,
        include_all_blocks=True,
        join_mode=JoinMode.JOIN_ALL,
        field_selection=hypersync.FieldSelection(
            block=[BlockField.NUMBER, BlockField.TIMESTAMP, BlockField.HASH],
            log=LOG_EVENTS,
            transaction=transactions
		)
    )
    print("Running the query...")
    res = await client.get(query)
    print(f"Ran the query once.  Next block to query is {res.next_block}")
    blocks = res.data.blocks
    logs = res.data.logs
    transactions = res.data.transactions
    print(len(blocks), len(logs), len(transactions))
    blocks, logs, transactions = serializeBlocks(blocks), serializeLogs(logs), serializeTransactions(transactions)
    return blocks, logs, transactions

async def runQueryBlocksTxns(client=None):
    if client is None: return "Please provide a client"
    query = hypersync.preset_query_blocks_and_transactions(17_000_000, 17_000_001)
    print("Running the query...")
    res = await client.get(query)

    print(f"Query returned {len(res.data.blocks)} blocks and {len(res.data.transactions)} transactions")
    blocks = serializeBlocks(res.data.blocks)
    transactions = serializeTransactions(res.data.transactions)
    return blocks, transactions

async def runQueryLogsData(client= None, contract="0xdAC17F958D2ee523a2206206994597C13D831ec7"):
    if client is None: 
        return "Please provide a client"
    query = hypersync.preset_query_logs(contract, 17_000_000, 17_000_050)
    print("Running the query...")
    res = await client.get(query)
    print(res.data.logs)
    data = serializeLogs(res.data.logs)
    return data

async def runQueryTxn(client= None, txn_hash=""):
    if client is None or txn_hash=="": return "Please provide client and contract"
    query = hypersync.Query(
        from_block=0,
        join_mode=JoinMode.JOIN_NOTHING,
        field_selection=hypersync.FieldSelection(
            transaction=TRANSACTIONS
        ),
        transactions=[
            TransactionSelection(
                hash=[
                    txn_hash
                ]
            )
        ],
    )
    
    print("Running the query...")

    res = await client.get(query)

    print(f"Ran the query once.  Next block to query is {res.next_block}")
    data = serializeTransactions(res.data.transactions)
    return data

def serializeBlocks(blocks):
    data = []
    for block in blocks:
        ans = {"Block Number": block.number, "Block Timstamp": block.timestamp, "Block Hash": block.hash}
        data.append(ans)
    return data 

def serializeLogs(logs):
    data = []
    for log in logs:
        ans = {"Log Index": log.log_index, "Data": log.data, "Address": log.address, "Topic": log.topics}
        data.append(ans)
    return data 

def serializeTransactions(transactions):
    data = []
    for transaction in transactions:
        ans = {"Transaction Index": transaction.transaction_index, "Transaction Hash": transaction.hash, "From": transaction.from_, "To": transaction.to, "Value": transaction.value, "Input": transaction.input}
        data.append(ans)
    return data
