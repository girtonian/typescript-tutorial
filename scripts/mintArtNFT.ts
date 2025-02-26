import { mintNFT } from './utils/mintNFT'
import { NFTContractAddress, account, client } from './utils/utils'
import { uploadJSONToIPFS } from './utils/uploadToIpfs'
import { createHash } from 'crypto'

const main = async function () {
    // 1. Set up your IP Metadata for the artwork
    const ipMetadata = {
        title: 'Echo',
        description: 'Echo is a vibrant, creative Curmunchkin who experiences tics that sometimes make unexpected sounds or movements.',
        createdAt: Date.now().toString(),
        creators: [
            {
                name: 'Curmunchkins',
                address: account.address,
                contributionPercent: 100,
            },
        ],
        image: 'https://magenta-eligible-shrimp-383.mypinata.cloud/ipfs/bafybeih7fxfkxahoms5skmntkvgzxsep5v2ibsqkv6ijqs6ow4yyrp7qky',
        imageHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        mediaType: 'image/png'
    }

    // 2. Set up your NFT Metadata
    const nftMetadata = {
        name: ipMetadata.title,
        description: ipMetadata.description,
        image: ipMetadata.image,
        attributes: [
            {
                trait_type: 'Artist',
                value: ipMetadata.creators[0].name,
            },
            {
                trait_type: 'Creation Date',
                value: new Date(parseInt(ipMetadata.createdAt)).toISOString().split('T')[0],
            },
            {
                trait_type: 'Condition',
                value: 'Tourettes Syndrome'
            },
            {
                trait_type: 'Curmunchkin Type',
                value: 'Munchie'
            }
        ],
    }

    try {
        // 3. Upload your IP and NFT Metadata to IPFS
        console.log('Uploading metadata to IPFS...')
        const ipIpfsHash = await uploadJSONToIPFS(ipMetadata)
        const ipHash = createHash('sha256').update(JSON.stringify(ipMetadata)).digest('hex')
        const nftIpfsHash = await uploadJSONToIPFS(nftMetadata)
        const nftHash = createHash('sha256').update(JSON.stringify(nftMetadata)).digest('hex')

        // 4. Mint the NFT
        console.log('Minting NFT...')
        const tokenId = await mintNFT(account.address, `https://ipfs.io/ipfs/${nftIpfsHash}`)
        console.log(`NFT minted successfully with tokenId ${tokenId}`)

        // 5. Register the IP Asset
        console.log('Registering IP Asset...')
        const response = await client.ipAsset.register({
            nftContract: NFTContractAddress,
            tokenId: tokenId!,
            ipMetadata: {
                ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
                ipMetadataHash: `0x${ipHash}`,
                nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
                nftMetadataHash: `0x${nftHash}`,
            },
            txOptions: { waitForTransaction: true },
        })

        console.log('\nSuccess! 🎉')
        console.log(`NFT Token ID: ${tokenId}`)
        console.log(`IP Asset ID: ${response.ipId}`)
        console.log(`Transaction Hash: ${response.txHash}`)
        console.log(`\nView your IP Asset on Story Protocol Explorer:`)
        console.log(`https://aeneid.explorer.story.foundation/ipa/${response.ipId}`)
    } catch (error) {
        console.error('Error:', error)
    }
}

main() 