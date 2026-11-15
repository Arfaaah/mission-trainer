// archive.js
// Real NASA data stored inside the game, used when the live data cannot be
// reached. Everything here is shown with an ARCHIVED tag and its source.

// Solar flares: every flare in NASA DONKI for 1 to 30 March 2025.
// Downloaded on 2026-11-15 from the DONKI web service run by NASA's
// Community Coordinated Modeling Center (CCMC):
// https://ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR?startDate=2025-03-01&endDate=2025-03-30
// Only classType and peakTime are kept (the two fields the game uses).
export const ARCHIVED_FLARES = {
  source: 'NASA DONKI (CCMC)',
  windowStart: '2025-03-01',
  windowEnd: '2025-03-30',
  flares: [
    { classType: 'C9.5', peakTime: '2025-03-01T23:01Z' },
    { classType: 'C2.4', peakTime: '2025-03-02T03:50Z' },
    { classType: 'C1.1', peakTime: '2025-03-02T05:57Z' },
    { classType: 'C2.9', peakTime: '2025-03-02T09:38Z' },
    { classType: 'M1.7', peakTime: '2025-03-05T11:50Z' },
    { classType: 'M1.6', peakTime: '2025-03-07T21:00Z' },
    { classType: 'M1.1', peakTime: '2025-03-11T13:04Z' },
    { classType: 'C9.6', peakTime: '2025-03-11T21:22Z' },
    { classType: 'M1.1', peakTime: '2025-03-14T22:21Z' },
    { classType: 'C9.8', peakTime: '2025-03-17T19:19Z' },
    { classType: 'M1.0', peakTime: '2025-03-17T19:33Z' },
    { classType: 'M1.5', peakTime: '2025-03-19T20:40Z' },
    { classType: 'C6.0', peakTime: '2025-03-20T00:07Z' },
    { classType: 'C4.4', peakTime: '2025-03-20T17:10Z' },
    { classType: 'M1.2', peakTime: '2025-03-21T15:58Z' },
    { classType: 'C4.4', peakTime: '2025-03-25T09:49Z' },
    { classType: 'C9.5', peakTime: '2025-03-25T12:29Z' },
    { classType: 'M1.0', peakTime: '2025-03-26T08:09Z' },
    { classType: 'C6.5', peakTime: '2025-03-26T09:12Z' },
    { classType: 'M2.0', peakTime: '2025-03-27T00:37Z' },
    { classType: 'C3.9', peakTime: '2025-03-27T03:01Z' },
    { classType: 'X1.1', peakTime: '2025-03-28T15:20Z' },
    { classType: 'M1.0', peakTime: '2025-03-28T18:01Z' },
    { classType: 'M1.1', peakTime: '2025-03-28T19:26Z' },
    { classType: 'M1.7', peakTime: '2025-03-28T23:39Z' },
    { classType: 'M1.4', peakTime: '2025-03-29T21:38Z' },
    { classType: 'M1.9', peakTime: '2025-03-29T23:00Z' },
    { classType: 'M1.5', peakTime: '2025-03-30T01:48Z' },
    { classType: 'C3.5', peakTime: '2025-03-30T04:16Z' },
    { classType: 'M1.6', peakTime: '2025-03-30T16:42Z' },
    { classType: 'M1.4', peakTime: '2025-03-30T17:07Z' },
    { classType: 'M1.4', peakTime: '2025-03-30T22:50Z' },
    { classType: 'M1.5', peakTime: '2025-03-30T23:19Z' },
    { classType: 'M1.0', peakTime: '2025-03-30T23:48Z' },
  ],
};
