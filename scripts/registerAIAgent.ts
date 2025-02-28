import { Address } from 'viem'
import { mintNFT } from './utils/mintNFT'
import { NFTContractAddress, NonCommercialSocialRemixingTermsId, account, client } from './utils/utils'
import { uploadJSONToIPFS } from './utils/uploadToIpfs'
import { createHash } from 'crypto'

const main = async function () {
    // The Echo NFT we created earlier
    const parentIpId = '0xF37d05F65A5e8DcC32e5a16289FfCCb828ee2C1F' as Address
    const parentTokenId = 756

    // 1. Set up AI Agent IP Metadata
    const ipMetadata = {
        title: 'Echo AI Agent',
        description: 'An AI Agent based on Echo, the creative Curmunchkin. This agent embodies Echo\'s vibrant personality while being mindful and understanding of neurodiversity.',
        createdAt: Date.now().toString(),
        creators: [
            {
                name: 'Curmunchkins',
                address: account.address,
                contributionPercent: 100,
            },
        ],
        parentIp: {
            id: parentIpId,
            tokenId: parentTokenId,
            relationship: 'Based on character Echo'
        },
        agentType: 'Character-based AI',
        mediaType: 'application/json'
    }

    // 2. Set up AI Agent NFT Metadata
    const nftMetadata = {
        name: ipMetadata.title,
        description: ipMetadata.description,
        attributes: [
            {
                trait_type: 'Agent Type',
                value: 'Character-based AI'
            },
            {
                trait_type: 'Base Character',
                value: 'Echo'
            },
            {
                trait_type: 'Creator',
                value: ipMetadata.creators[0].name
            },
            {
                trait_type: 'Creation Date',
                value: new Date(parseInt(ipMetadata.createdAt)).toISOString().split('T')[0]
            }
        ]
    }

    try {
        // 3. Upload metadata to IPFS
        console.log('Uploading AI Agent metadata to IPFS...')
        const ipIpfsHash = await uploadJSONToIPFS(ipMetadata)
        const ipHash = createHash('sha256').update(JSON.stringify(ipMetadata)).digest('hex')
        const nftIpfsHash = await uploadJSONToIPFS(nftMetadata)
        const nftHash = createHash('sha256').update(JSON.stringify(nftMetadata)).digest('hex')

        // 4. Mint NFT for the AI Agent
        console.log('Minting AI Agent NFT...')
        const tokenId = await mintNFT(account.address, `https://ipfs.io/ipfs/${nftIpfsHash}`)
        console.log(`AI Agent NFT minted successfully with tokenId ${tokenId}`)

        // 5. Register parent IP with non-commercial license terms
        console.log('Registering parent IP with non-commercial license terms...')
        const parentIpResponse = await client.ipAsset.register({
            nftContract: NFTContractAddress,
            tokenId: parentTokenId,
            ipMetadata: {
                ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
                ipMetadataHash: `0x${ipHash}`,
                nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
                nftMetadataHash: `0x${nftHash}`,
            },
            txOptions: { waitForTransaction: true },
        })
        console.log('Parent IP registered with non-commercial license terms')

        // 6. Register as Non-Commercial Derivative IP
        console.log('Registering AI Agent as non-commercial derivative IP...')
        const response = await client.ipAsset.registerDerivativeIp({
            nftContract: NFTContractAddress,
            tokenId: tokenId!,
            derivData: {
                parentIpIds: [parentIpId],
                licenseTermsIds: [NonCommercialSocialRemixingTermsId],
                maxMintingFee: 0,
                maxRts: 100_000_000,
                maxRevenueShare: 100
            },
            ipMetadata: {
                ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
                ipMetadataHash: `0x${ipHash}`,
                nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
                nftMetadataHash: `0x${nftHash}`,
            },
            txOptions: { waitForTransaction: true },
        })

        console.log('\nSuccess! 🎉')
        console.log(`AI Agent NFT Token ID: ${tokenId}`)
        console.log(`AI Agent IP Asset ID: ${response.ipId}`)
        console.log(`Transaction Hash: ${response.txHash}`)
        console.log(`\nView your AI Agent IP Asset on Story Protocol Explorer:`)
        console.log(`https://aeneid.explorer.story.foundation/ipa/${response.ipId}`)
    } catch (error) {
        console.error('Error:', error)
    }
}

main() 