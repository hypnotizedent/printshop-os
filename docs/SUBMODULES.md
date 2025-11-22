# Git Submodules

## ptavo Reference Implementation

The `lib/ptavo` directory contains the ptavo repository as a Git submodule. This serves as a reference implementation for printshop-os development.

### Cloning This Repository

When cloning printshop-os, use one of these approaches:

**Option 1: Clone with submodules**
```bash
git clone --recursive https://github.com/hypnotizedent/printshop-os.git
```

**Option 2: Initialize submodules after cloning**
```bash
git clone https://github.com/hypnotizedent/printshop-os.git
cd printshop-os
git submodule update --init --recursive
```

### Updating the ptavo Submodule

To update the ptavo reference to a newer version:

```bash
cd lib/ptavo
git pull origin main  # or the branch you want
cd ../..
git add lib/ptavo
git commit -m "chore: Update ptavo submodule reference"
```

### Note

The ptavo submodule is for reference purposes only. The printshop-os and ptavo repositories maintain completely separate development histories.
