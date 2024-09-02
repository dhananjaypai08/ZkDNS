import hypersync 
from hypersync import BlockField, JoinMode, TransactionField, LogField, ClientConfig, TransactionSelection

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

def getClient(url: str):
    client = client = hypersync.HypersyncClient(ClientConfig())
    return client 

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
    query = hypersync.preset_query_blocks_and_transactions(17_000_000, 17_000_050)
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
