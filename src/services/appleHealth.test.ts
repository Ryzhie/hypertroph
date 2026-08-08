import { describe, it, expect } from 'vitest'
import { parseHealthFile } from '../services/appleHealth'

/** Minimal valid Apple Health export.xml fixture. */
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
  <ExportDate value="2024-01-15 10:00:00 +0000"/>
  <Me HKCharacteristicTypeIdentifierDateOfBirth="1990-01-01" HKCharacteristicTypeIdentifierBiologicalSex="HKBiologicalSexMale"/>
  <Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Health" sourceVersion="17.2" unit="kg" creationDate="2024-01-10 08:00:00 +0000" startDate="2024-01-10 08:00:00 +0000" endDate="2024-01-10 08:00:00 +0000" value="82.5"/>
  <Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Health" sourceVersion="17.2" unit="kg" creationDate="2024-01-11 08:00:00 +0000" startDate="2024-01-11 08:00:00 +0000" endDate="2024-01-11 08:00:00 +0000" value="82.2"/>
  <Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Health" sourceVersion="17.2" unit="kg" creationDate="2024-01-12 08:00:00 +0000" startDate="2024-01-12 08:00:00 +0000" endDate="2024-01-12 08:00:00 +0000" value="81.8"/>
  <Record type="HKQuantityTypeIdentifierHeight" sourceName="Health" sourceVersion="17.2" unit="cm" creationDate="2023-06-01 10:00:00 +0000" startDate="2023-06-01 10:00:00 +0000" endDate="2023-06-01 10:00:00 +0000" value="178"/>
  <Record type="HKQuantityTypeIdentifierBodyFatPercentage" sourceName="Withings" sourceVersion="1.0" unit="%" creationDate="2024-01-10 07:00:00 +0000" startDate="2024-01-10 07:00:00 +0000" endDate="2024-01-10 07:00:00 +0000" value="0.18"/>
</HealthData>`

const xmlLb = xml.replaceAll('unit="kg"', 'unit="lb"').replace('value="82.5"', 'value="181.9"').replace('value="82.2"', 'value="181.2"').replace('value="81.8"', 'value="180.4"')

function makeFile(content: string, name = 'export.xml'): File {
  return new File([content], name, { type: 'text/xml' })
}

describe('parseHealthFile', () => {
  it('extracts latest weight/height/body-fat and builds daily history', async () => {
    const res = await parseHealthFile(makeFile(xml))
    expect(res.weightKg).toBe(81.8)
    expect(res.heightCm).toBe(178)
    expect(res.bodyFatPct).toBe(18)
    expect(res.weightHistory.length).toBe(3)
    // newest first
    expect(res.weightHistory[0]).toEqual({ date: '2024-01-12', weightKg: 81.8 })
    expect(res.weightHistory[1]).toEqual({ date: '2024-01-11', weightKg: 82.2 })
    expect(res.weightHistory[2]).toEqual({ date: '2024-01-10', weightKg: 82.5 })
  })

  it('converts lb → kg', async () => {
    const res = await parseHealthFile(makeFile(xmlLb))
    expect(res.weightKg).toBeCloseTo(81.8, 1)
  })

  it('treats body-fat as fraction when ≤ 1, percent when > 70', async () => {
    // fraction 0.18 → 18%
    const xmlFrac = xml.replace('value="0.18"', 'value="0.20"')
    let res = await parseHealthFile(makeFile(xmlFrac))
    expect(res.bodyFatPct).toBe(20)

    // already in percent → clamp to max realistic 70%
    const xmlPct = xml.replace('unit="%"', 'unit="%"').replace('value="0.18"', 'value="25"')
    res = await parseHealthFile(makeFile(xmlPct))
    expect(res.bodyFatPct).toBe(25)
  })

  it('throws on missing body-weight records', async () => {
    const noWeight = xml.replace(/<Record type="HKQuantityTypeIdentifierBodyMass"[^>]*\/>/g, '')
    await expect(parseHealthFile(makeFile(noWeight))).rejects.toThrow(/body-weight records/i)
  })

  it('throws on empty / invalid XML', async () => {
    await expect(parseHealthFile(makeFile(''))).rejects.toThrow(/empty/i)
    await expect(parseHealthFile(makeFile('<not-health/>'))).rejects.toThrow(/No Health records/i)
  })

  it('deduplicates same-day weight entries (keeps newest)', async () => {
    const dup = xml
      .replace('<Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Health" sourceVersion="17.2" unit="kg" creationDate="2024-01-10 08:00:00 +0000" startDate="2024-01-10 08:00:00 +0000" endDate="2024-01-10 08:00:00 +0000" value="82.5"/>', '')
    // add two entries same day
    const withDup = dup.replace(
      '</HealthData>',
      `<Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Health" sourceVersion="17.2" unit="kg" creationDate="2024-01-10 09:00:00 +0000" startDate="2024-01-10 09:00:00 +0000" endDate="2024-01-10 09:00:00 +0000" value="83.0"/>
</HealthData>`
    )
    const res = await parseHealthFile(makeFile(withDup))
    // only one entry per day (the later one)
    expect(res.weightHistory[2]).toEqual({ date: '2024-01-10', weightKg: 83.0 })
  })
})