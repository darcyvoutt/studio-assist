export const param = (key) => {
  const param = process.argv.filter((item) => item.includes(key))[0]
  return param.split('=')[1]
}
