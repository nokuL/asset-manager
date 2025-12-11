import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { asset_id, asset_name, serial_number } = await request.json()
    
    const username = process.env.WARRANTY_API_USERNAME
    const password = process.env.WARRANTY_API_PASSWORD
    const apiUrl = process.env.WARRANTY_API_URL || 'https://server5.eport.ws'
    
    if (!username || !password) {
      console.error('Missing WARRANTY_API_USERNAME or WARRANTY_API_PASSWORD environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    // Login to Python API
    const loginResponse = await fetch(`${apiUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username,
        password
      })
    })
    
    if (!loginResponse.ok) {
      throw new Error('Failed to authenticate with warranty system')
    }
    
    const { access_token } = await loginResponse.json()
    
    // Register warranty
    const warrantyResponse = await fetch(`${apiUrl}/api/register-warranty`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
      body: JSON.stringify({
        asset_id,
        asset_name,
        serial_number
      })
    })
    
    if (!warrantyResponse.ok) {
      const error = await warrantyResponse.json()
      throw new Error(error.detail || 'Failed to register warranty')
    }
    
    const data = await warrantyResponse.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Warranty registration error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}