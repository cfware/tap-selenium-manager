export default bin => process.platform === 'win32' ? `${bin}.cmd` : bin;
