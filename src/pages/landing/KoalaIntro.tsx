import { useId } from 'react'

// The palm sits behind the frond; only the curled digits cross its outer edge.
export function KoalaPaw({ layer }: { layer: 'back' | 'front' }) {
  const shade = useId()
  return <g transform="translate(330 -110)">
    <defs>
      <linearGradient id={shade} x1="0" y1="0" x2=".85" y2="1">
        <stop stopColor="#c2cbc9" />
        <stop offset=".5" stopColor="#a2afae" />
        <stop offset="1" stopColor="#748785" />
      </linearGradient>
    </defs>
    <g className={`koala-paw koala-paw--${layer}`}>
      {layer === 'back' ? <>
        <path d="M57 19C71 13 86 22 91 36L94 57C96 72 87 85 74 87 61 89 48 80 45 66L43 42C42 31 47 23 57 19Z" fill={`url(#${shade})`} stroke="#667b76" strokeWidth="1.2" />
        <path d="M73 24Q85 31 87 43" fill="none" stroke="#dae0d9" strokeOpacity=".4" strokeWidth="2.5" strokeLinecap="round" />
      </> : <g className="koala-paw-fingers" strokeLinecap="round" strokeLinejoin="round">
        {[26, 40, 54].map((y, index) => <g key={y} transform={`translate(${index === 1 ? -3 : 0} ${y})`}>
          <path d="M79 0C69-5 53-9 45-5 36-1 36 8 43 12 49 16 57 11 62 10L77 13Z" fill="#031009" opacity=".25" transform="translate(-1 3)" />
          <path d="M79 0C69-5 53-9 45-5 36-1 36 8 43 12 49 16 57 11 62 10L77 13Q84 9 79 0Z" fill={`url(#${shade})`} />
          <path d="M47-2Q57-5 68 0" fill="none" stroke="#e0e5dd" strokeOpacity=".45" strokeWidth="1.8" />
          <path d="M44 3C39 2 36 5 36 9Q36 15 42 18C40 13 44 10 47 9Q49 5 44 3Z" fill="#293431" stroke="#202a27" strokeWidth=".7" />
          <path d="M42 5Q38 6 39 10" fill="none" stroke="#81908a" strokeOpacity=".7" strokeWidth="1.2" />
          <path d="M57 5 56 9" fill="none" stroke="#6c8079" strokeOpacity=".5" strokeWidth="1" />
        </g>)}
        <path d="M85 66C80 63 72 65 67 70L58 73C52 75 53 83 60 85 71 90 85 81 88 74Q90 69 85 66Z" fill={`url(#${shade})`} />
        <path d="M59 73C54 72 50 76 51 80Q52 86 58 88C55 83 59 80 62 79Q64 75 59 73Z" fill="#293431" stroke="#202a27" strokeWidth=".7" />
        <path d="M57 75Q53 76 54 80" fill="none" stroke="#81908a" strokeOpacity=".7" strokeWidth="1.2" />
        <path d="M72 71 81 69" fill="none" stroke="#d8dfd6" strokeOpacity=".35" strokeWidth="2" />
      </g>}
    </g>
  </g>
}
