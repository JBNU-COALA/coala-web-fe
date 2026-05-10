export type LabOption = {
  name: string
  professor: string
}

// Source: 전북대학교 컴퓨터인공지능학부 대학원연구실 페이지, 가나다순 정렬.
export const csaiLabOptions: LabOption[] = [
  { name: '고성능컴퓨팅연구실', professor: '윤수경' },
  { name: '네트워크공학첨단기술연구실', professor: '성지훈' },
  { name: '네트워크컴퓨팅연구실', professor: '편기현' },
  { name: '데이터베이스연구실', professor: '장재우' },
  { name: '분산컴퓨팅연구실', professor: '강동기' },
  { name: '소프트웨어순환공학연구실', professor: '이문근' },
  { name: '소프트웨어인터랙션연구실', professor: '정종욱' },
  { name: '시각및학습연구실', professor: '김성찬' },
  { name: '시각지능연구실', professor: '이세호' },
  { name: '암호연구실', professor: '김지승' },
  { name: '운영체제연구실', professor: '박현찬' },
  { name: '의료인공지능및계산과학연구실', professor: '이경수' },
  { name: '자연언어학습연구실', professor: '송현제' },
  { name: '정보마이닝연구실', professor: '이경순' },
  { name: '정보보호연구실', professor: '홍득조' },
  { name: '컴퓨터비젼연구실', professor: '곽영태' },
  { name: '컴퓨터비젼연구실', professor: '오일석' },
  { name: '컴파일러인텔리전스연구실', professor: '박혁우' },
  { name: '컴퓨팅 및 통신 시스템 연구실', professor: '김찬기' },
  { name: '패턴인식및합성연구실', professor: '박순찬' },
]

export function formatLabOption(option: LabOption) {
  return `${option.name} : ${option.professor}교수님`
}
